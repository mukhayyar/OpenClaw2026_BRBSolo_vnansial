/**
 * Telegram bot integration (env-gated).
 *
 * Activated when `TELEGRAM_BOT_TOKEN` is set. Uses long polling — no
 * webhook setup needed for local dev. For production self-host, point
 * the bot at this server and use webhooks (see DEPLOYMENT.md).
 *
 * Commands:
 *   /start            — sapa & bind chat_id ke user
 *   /help             — daftar perintah
 *   /score            — minta skor kesehatan finansial terakhir
 *   /quote SYMBOL     — kutipan saham/crypto
 *   /crypto ID        — risk score crypto
 *   /emiten KODE      — IDX company snapshot
 *   /ask <pertanyaan> — relay ke Asisten AI (gunakan tool calling)
 *
 * Polling loop & graceful shutdown built in.
 */

import { ensureUser, listHealthSnapshots, listHoldings } from '../lib/db.js'
import { getQuote } from '../lib/yahoo.js'
import { getCompanyProfile } from '../lib/idx.js'
import { assessCryptoRisk, getCoinDetail } from '../lib/coingecko.js'
import { runAgentChat } from '../agent/loop.js'

const TOKEN = process.env.TELEGRAM_BOT_TOKEN
const API = TOKEN ? `https://api.telegram.org/bot${TOKEN}` : null
let lastUpdateId = 0
let running = false

function fmtIDR(n) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0)
}

async function tg(method, payload) {
  if (!API) return null
  const res = await fetch(`${API}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return res.json()
}

async function reply(chatId, text, opts = {}) {
  return tg('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: opts.parse_mode || 'Markdown',
    disable_web_page_preview: true,
  })
}

const HELP = `*Vnansial Asisten*

Perintah yang tersedia:
\`/score\` — skor kesehatan finansial terakhir
\`/quote SYMBOL\` — kutipan saham (AAPL, BBCA.JK)
\`/crypto ID\` — risk score crypto (bitcoin, ethereum, …)
\`/emiten KODE\` — info perusahaan IDX (BBCA, GOTO, AADI, …)
\`/ask <pertanyaan>\` — tanya bebas ke asisten AI

Buka aplikasi web untuk fitur lengkap.`

async function handleCommand(message) {
  const chatId = message.chat.id
  const text = (message.text || '').trim()
  const [cmd, ...rest] = text.split(/\s+/)
  const arg = rest.join(' ').trim()
  const user = ensureUser({ telegramChatId: chatId, nickname: message.from?.first_name })

  try {
    if (cmd === '/start') {
      await reply(chatId, `Halo ${message.from?.first_name || 'di sana'}! Akun Telegram-mu terbind ke Vnansial.\n\n${HELP}`)
      return
    }
    if (cmd === '/help') {
      await reply(chatId, HELP)
      return
    }
    if (cmd === '/score') {
      const snaps = listHealthSnapshots(user.id, 1)
      if (!snaps.length) {
        await reply(chatId, 'Belum ada skor tersimpan. Buka aplikasi web → /kesehatan, lalu jalankan ulang `/score`.')
        return
      }
      const s = snaps[0]
      await reply(chatId, `*Skor Kesehatan Finansial:* ${s.score}/100\n_Diukur ${new Date(s.created_at).toLocaleString('id-ID')}_`)
      return
    }
    if (cmd === '/quote') {
      if (!arg) return reply(chatId, 'Format: `/quote AAPL` atau `/quote BBCA.JK`')
      const q = await getQuote(arg)
      if (q.error) return reply(chatId, `Tidak ketemu: ${q.error}`)
      await reply(chatId, `*${q.shortName}* (${q.symbol})\nHarga: ${q.currency === 'IDR' ? fmtIDR(q.regularMarketPrice) : `$${q.regularMarketPrice}`}\nPerubahan: ${q.regularMarketChangePercent?.toFixed(2)}%`)
      return
    }
    if (cmd === '/crypto') {
      if (!arg) return reply(chatId, 'Format: `/crypto bitcoin` atau `/crypto ethereum`')
      const r = await assessCryptoRisk(arg.toLowerCase())
      if (r.error) return reply(chatId, `Tidak ketemu: ${r.error}`)
      const top = r.risk.reasons.slice(0, 3).map(x => `• ${x}`).join('\n')
      await reply(chatId, `*${r.coin.name}* (${r.coin.symbol})\nHarga: $${r.coin.price}\n30d: ${r.coin.change30d?.toFixed(1)}%\n*Risk score:* ${r.risk.score}/100 (${r.risk.level})\n\n${top}`)
      return
    }
    if (cmd === '/emiten') {
      if (!arg) return reply(chatId, 'Format: `/emiten BBCA`')
      const p = await getCompanyProfile(arg)
      if (p.error) return reply(chatId, `IDX error: ${p.error}`)
      const profile = p?.Profiles?.[0] || p?.profile?.[0] || {}
      await reply(chatId, `*${profile.NamaEmiten || arg}* (${arg.toUpperCase()})\nSektor: ${profile.Sektor || '—'}\nListing: ${profile.TanggalPencatatan || '—'}\nAlamat: ${profile.Alamat || '—'}`)
      return
    }
    if (cmd === '/ask') {
      if (!arg) return reply(chatId, 'Format: `/ask apakah BBCA cocok untuk pemula?`')
      await reply(chatId, '⏳ Berpikir…')
      try {
        const r = await runAgentChat([{ role: 'user', content: arg }])
        const out = (r.message || '').slice(0, 3500)
        await reply(chatId, out || '(tidak ada jawaban)')
      } catch (err) {
        await reply(chatId, `Maaf, asisten error: ${err.message}`)
      }
      return
    }
    if (cmd === '/portofolio' || cmd === '/portfolio') {
      const rows = listHoldings(user.id)
      if (!rows.length) return reply(chatId, 'Belum ada holding. Tambah dari aplikasi web → /portofolio.')
      const lines = rows.map(r => `• ${r.symbol} (${r.kind}) × ${r.amount}`).slice(0, 20).join('\n')
      await reply(chatId, `*Portofolio kamu*\n${lines}`)
      return
    }
    // Fallback: treat as /ask
    if (text.length > 1) {
      await reply(chatId, '⏳ Berpikir…')
      const r = await runAgentChat([{ role: 'user', content: text }])
      await reply(chatId, (r.message || '').slice(0, 3500))
    }
  } catch (err) {
    console.error('[telegram] error', err)
    await reply(chatId, `Maaf, error: ${err.message}`)
  }
}

async function pollOnce() {
  if (!API) return
  try {
    const res = await fetch(`${API}/getUpdates?offset=${lastUpdateId + 1}&timeout=20`, {
      method: 'GET',
    })
    const data = await res.json()
    if (!data.ok) return
    for (const u of data.result || []) {
      lastUpdateId = u.update_id
      if (u.message?.text) await handleCommand(u.message)
    }
  } catch (err) {
    console.error('[telegram] poll error', err.message)
    await new Promise(r => setTimeout(r, 4000))
  }
}

export function startTelegram() {
  if (!TOKEN) {
    console.log('[telegram] TELEGRAM_BOT_TOKEN not set — bot disabled.')
    return false
  }
  if (running) return true
  running = true
  console.log('[telegram] Bot started, polling for updates…')
  ;(async () => {
    while (running) {
      await pollOnce()
    }
  })()
  return true
}

export function stopTelegram() {
  running = false
}
