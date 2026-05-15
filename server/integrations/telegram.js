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

import { ensureUser, listHealthSnapshots, listHoldings, listSessions, getSession, listMessages, listAlerts, saveSettings, getSettings } from '../lib/db.js'
import { getQuote } from '../lib/yahoo.js'
import { getCompanyProfile } from '../lib/idx.js'
import { assessCryptoRisk, getCoinDetail } from '../lib/coingecko.js'
import { runAgentChat } from '../agent/loop.js'
import { findAgent } from '../agent/presets.js'

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

Perintah:
\`/score\` — skor kesehatan finansial terakhir
\`/quote SYMBOL\` — kutipan saham (AAPL, BBCA.JK)
\`/crypto ID\` — risk score crypto (bitcoin, ethereum, …)
\`/emiten KODE\` — info perusahaan IDX
\`/ask <pertanyaan>\` — tanya bebas ke asisten AI
\`/sessions\` — daftar sesi chat dari web
\`/continue NUM\` — lanjutkan sesi web di Telegram (pakai konteks 5 pesan terakhir)
\`/alerts\` — daftar price alert aktif
\`/bind\` — bind chat ini ke akun web (PIN diatur server-side)

Buka aplikasi web untuk fitur lengkap.`

async function handleCommand(message) {
  const chatId = message.chat.id
  const text = (message.text || '').trim()
  const [cmd, ...rest] = text.split(/\s+/)
  const arg = rest.join(' ').trim()
  const user = ensureUser({ telegramChatId: chatId, nickname: message.from?.first_name })
  // Auto-bind chat id to the same user's settings row so the cron daemon can notify
  try {
    const existing = getSettings(user.id)
    if (!existing || existing.telegram_chat_id !== String(chatId)) {
      saveSettings({ userId: user.id, telegramChatId: String(chatId), defaultAgentId: existing?.default_agent_id || 'generalis' })
    }
  } catch {}

  try {
    if (cmd === '/start' || cmd === '/bind') {
      await reply(chatId, `Halo ${message.from?.first_name || 'di sana'}! Akun Telegram-mu terbind ke Vnansial (chat_id: \`${chatId}\`).\n\nAlert harga & notifikasi cron akan masuk ke chat ini.\n\n${HELP}`)
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
    if (cmd === '/sessions') {
      const sess = listSessions(user.id, 10)
      if (!sess.length) return reply(chatId, 'Belum ada sesi web. Buka /asisten di web app dulu.')
      const lines = sess
        .map(s => `#${s.id} · ${s.title} _(${s.agent_id})_`)
        .join('\n')
      await reply(chatId, `*Sesi terakhir:*\n${lines}\n\nLanjutkan: \`/continue <id>\``)
      return
    }
    if (cmd === '/continue') {
      const id = Number(arg)
      if (!id) return reply(chatId, 'Format: `/continue 12`')
      const s = getSession(id)
      if (!s || s.user_id !== user.id) return reply(chatId, 'Sesi tidak ditemukan.')
      const msgs = listMessages(s.id).slice(-5).map(m => ({ role: m.role, content: m.content }))
      await reply(chatId, `Lanjut sesi #${s.id} (_${s.title}_, agent ${s.agent_id}). Tulis pertanyaanmu — saya pakai 5 pesan terakhir sebagai konteks.`)
      // Stash context so the next non-command message uses it
      pendingContext.set(chatId, { sessionId: s.id, agentId: s.agent_id, history: msgs })
      return
    }
    if (cmd === '/alerts') {
      const alerts = listAlerts(user.id, true)
      if (!alerts.length) return reply(chatId, 'Belum ada alert aktif. Buat via asisten AI: "Buat alert kalau BBCA di atas 10000".')
      const lines = alerts.map(a => `#${a.id} ${a.kind.toUpperCase()} ${a.symbol} ${a.condition} ${a.target}`).join('\n')
      await reply(chatId, `*Alert aktif:*\n${lines}`)
      return
    }
    // Fallback: treat as /ask, with pending /continue context if any
    if (text.length > 1) {
      await reply(chatId, '⏳ Berpikir…')
      const pend = pendingContext.get(chatId)
      const messages = pend
        ? [...pend.history, { role: 'user', content: text }]
        : [{ role: 'user', content: text }]
      const agent = pend ? findAgent(pend.agentId) : undefined
      const r = await runAgentChat(messages, agent ? { agent, pin: process.env.VNANSIAL_PIN || null } : { pin: process.env.VNANSIAL_PIN || null })
      await reply(chatId, (r.message || '').slice(0, 3500))
      // Clear pending context after one use
      if (pend) pendingContext.delete(chatId)
    }
  } catch (err) {
    console.error('[telegram] error', err)
    await reply(chatId, `Maaf, error: ${err.message}`)
  }
}

// Per-chat pending context for /continue → next message uses session history.
const pendingContext = new Map()

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
