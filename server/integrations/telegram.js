/**
 * Telegram bot integration (env-gated).
 *
 * Activated when `TELEGRAM_BOT_TOKEN` is set. Uses long polling — no
 * webhook setup needed for local dev.
 *
 * Commands: /start /help /score /quote /crypto /emiten /ask /sessions
 *           /continue /alerts /reminders /bind /portofolio
 *
 * UX features:
 *  - Auto-bind chat_id to user.settings on every message
 *  - Progressive status: sends "⏳ Berpikir…" then edits with each tool
 *    name as the agent works, then edits with the final answer
 *  - Chart markers ([[chart:kind:symbol:range]]) are rendered as actual
 *    PNG images via QuickChart and sent with sendPhoto
 */

import {
  ensureUser,
  listHealthSnapshots,
  listHoldings,
  listSessions,
  getSession,
  listMessages,
  listAlerts,
  saveSettings,
  getSettings,
  listReminders,
} from '../lib/db.js'
import { getQuote } from '../lib/yahoo.js'
import { getCompanyProfile } from '../lib/idx.js'
import { assessCryptoRisk, getCoinDetail } from '../lib/coingecko.js'
import { runAgentChat } from '../agent/loop.js'
import { findAgent } from '../agent/presets.js'
import {
  buildChartTelegramPayload,
  extractChartMarkers,
  stripChartMarkers,
} from '../lib/chartImage.js'

const TOKEN = process.env.TELEGRAM_BOT_TOKEN
const API = TOKEN ? `https://api.telegram.org/bot${TOKEN}` : null
let lastUpdateId = 0
let running = false

const TOOL_LABELS = {
  check_investment_company: 'Cek izin OJK',
  calculate_loan: 'Hitung pinjaman',
  assess_investment_red_flags: 'Nilai red flag',
  get_fraud_report_guide: 'Panduan lapor',
  get_market_quote: 'Ambil harga pasar',
  search_market_symbols: 'Cari simbol pasar',
  calculate_investment_goal: 'Simulasi tabungan',
  suggest_asset_allocation: 'Saran alokasi aset',
  score_financial_health: 'Skor kesehatan',
  get_idx_company: 'Profil emiten IDX',
  get_idx_dividen: 'Dividen IDX',
  get_idx_financial: 'Laporan keuangan',
  list_idx_emiten: 'Daftar emiten',
  get_crypto_quote: 'Kutipan crypto',
  assess_crypto_scam_risk: 'Risk score crypto',
  list_insurance_companies: 'Daftar asuransi',
  calculate_insurance_premium: 'Hitung premi',
  recommend_insurance: 'Rekomendasi asuransi',
  get_user_portfolio: 'Baca portofolio',
  add_portfolio_holding: 'Tambah holding',
  remove_portfolio_holding: 'Hapus holding',
  update_money_buffer: 'Update buffer',
  save_health_score: 'Simpan skor',
  list_health_history: 'Riwayat skor',
  check_bank_account_report: 'Cek rekening',
  check_phone_number_report: 'Cek nomor HP',
  render_chart: 'Siapkan grafik',
  create_price_alert: 'Buat alert',
  list_price_alerts: 'Daftar alert',
  delete_price_alert: 'Hapus alert',
  ask_other_agent: 'Tanya agent lain',
  search_dex_token: 'Cari DEX token',
  assess_dex_token: 'Risk score DEX',
  create_reminder: 'Buat pengingat',
  list_reminders: 'Daftar pengingat',
  delete_reminder: 'Hapus pengingat',
}

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

async function editMessage(chatId, messageId, text, opts = {}) {
  return tg('editMessageText', {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: opts.parse_mode || 'Markdown',
    disable_web_page_preview: true,
  })
}

async function sendPhoto(chatId, photoUrl, caption) {
  return tg('sendPhoto', {
    chat_id: chatId,
    photo: photoUrl,
    caption,
    parse_mode: 'Markdown',
  })
}

const HELP = `*Vnansial Asisten*

Perintah:
\`/score\` — skor kesehatan finansial terakhir
\`/quote SYMBOL\` — kutipan saham (AAPL, BBCA.JK)
\`/crypto ID\` — risk score crypto
\`/emiten KODE\` — info perusahaan IDX
\`/ask <pertanyaan>\` — tanya bebas ke asisten AI
\`/sessions\` — daftar sesi chat dari web
\`/continue NUM\` — lanjutkan sesi web
\`/alerts\` — daftar price alert aktif
\`/reminders\` — daftar pengingat aktif
\`/bind\` — bind chat ini ke akun web

Atau ketik pertanyaan biasa. Saya bisa:
• Tampilkan *grafik harga* (image, bukan text)
• Buat *alert harga* (notif otomatis saat tercapai)
• Buat *pengingat* (cron daemon)
• Cek *rekening / nomor HP* dari database Kominfo
• Cek *meme coin* dari DexScreener
• Akses *portofolio kamu* (perlu PIN dari web)`

// Per-chat /continue context
const pendingContext = new Map()

async function handleAgentTurn(chatId, fromName, messages, agentOpts = {}) {
  // 1. Send initial "thinking" message
  const initial = await reply(chatId, '⏳ Berpikir…')
  const messageId = initial?.result?.message_id
  const steps = []

  // 2. Build progress callback that edits the message
  let lastEdit = 0
  async function flushStatus(extraLine = '') {
    if (!messageId) return
    if (Date.now() - lastEdit < 900) return // throttle Telegram edits to ~1/sec
    lastEdit = Date.now()
    const body =
      '⚙️ *Bekerja…*\n' +
      steps.map((s, i) => `${i + 1}. ${s}`).join('\n') +
      (extraLine ? `\n${extraLine}` : '')
    try {
      await editMessage(chatId, messageId, body.slice(0, 3500))
    } catch {}
  }

  async function onProgress(evt) {
    if (evt.phase === 'thinking') {
      steps.push(`_Berpikir…_`)
      await flushStatus()
    } else if (evt.phase === 'tool_start') {
      const lbl = TOOL_LABELS[evt.name] || evt.name
      steps.push(`🔧 \`${evt.name}\` — ${lbl}`)
      await flushStatus()
    } else if (evt.phase === 'tool_done') {
      const idx = steps.length - 1
      if (idx >= 0) {
        steps[idx] = steps[idx].replace(/^🔧/, evt.ok ? '✅' : '⚠️')
      }
      await flushStatus()
    }
  }

  // 3. Run agent
  let result
  try {
    result = await runAgentChat(messages, { ...agentOpts, onProgress, pin: process.env.VNANSIAL_PIN || null })
  } catch (err) {
    if (messageId) {
      await editMessage(chatId, messageId, `❌ Error: ${err.message}`)
    } else {
      await reply(chatId, `❌ Error: ${err.message}`)
    }
    return
  }

  const finalText = stripChartMarkers(result.message || '').trim() || '_(jawaban kosong)_'
  const charts = extractChartMarkers(result.message)

  // 4. Edit the working message with the final answer + tool summary
  const summary =
    finalText +
    (steps.length
      ? `\n\n_Tool dipakai: ${steps.length} (${(result.toolCalls || []).map(t => t.name).join(', ')})_`
      : '')
  if (messageId) {
    await editMessage(chatId, messageId, summary.slice(0, 3500))
  } else {
    await reply(chatId, summary)
  }

  // 5. Send any chart images
  for (const c of charts) {
    const payload = await buildChartTelegramPayload(c)
    if (payload.photoUrl) {
      await sendPhoto(chatId, payload.photoUrl, payload.caption)
    } else if (payload.caption) {
      await reply(chatId, payload.caption)
    }
  }
}

async function handleCommand(message) {
  const chatId = message.chat.id
  const text = (message.text || '').trim()
  const [cmd, ...rest] = text.split(/\s+/)
  const arg = rest.join(' ').trim()
  const user = ensureUser({ telegramChatId: chatId, nickname: message.from?.first_name })

  // Auto-bind chat_id so cron alerts / reminders know where to send
  try {
    const existing = getSettings(user.id)
    if (!existing || existing.telegram_chat_id !== String(chatId)) {
      saveSettings({
        userId: user.id,
        telegramChatId: String(chatId),
        defaultAgentId: existing?.default_agent_id || 'generalis',
      })
    }
  } catch {}

  try {
    if (cmd === '/start' || cmd === '/bind') {
      await reply(
        chatId,
        `Halo ${message.from?.first_name || 'di sana'}! Akun Telegram-mu terbind ke Vnansial (chat_id: \`${chatId}\`).\n\n` +
          `Alert harga & reminder akan masuk ke chat ini.\n\n${HELP}`,
      )
      return
    }
    if (cmd === '/help') {
      await reply(chatId, HELP)
      return
    }
    if (cmd === '/score') {
      const snaps = listHealthSnapshots(user.id, 1)
      if (!snaps.length) {
        await reply(chatId, 'Belum ada skor tersimpan. Buka /kesehatan di web app.')
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
      const lines = sess.map(s => `#${s.id} · ${s.title} _(${s.agent_id})_`).join('\n')
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
      pendingContext.set(chatId, { sessionId: s.id, agentId: s.agent_id, history: msgs })
      return
    }
    if (cmd === '/alerts') {
      const alerts = listAlerts(user.id, true)
      if (!alerts.length) return reply(chatId, 'Belum ada alert aktif. Buat via asisten: "Buat alert kalau BBCA di atas 10000".')
      const lines = alerts.map(a => `#${a.id} ${a.kind.toUpperCase()} ${a.symbol} ${a.condition} ${a.target}`).join('\n')
      await reply(chatId, `*Alert aktif:*\n${lines}`)
      return
    }
    if (cmd === '/reminders' || cmd === '/remind') {
      const rems = listReminders(user.id, false)
      if (!rems.length) return reply(chatId, 'Belum ada reminder. Coba: _ingatkan saya bayar tagihan 5 menit lagi_.')
      const lines = rems.slice(0, 15).map(r => `#${r.id} _${new Date(r.fire_at).toLocaleString('id-ID')}_ — ${r.message}`).join('\n')
      await reply(chatId, `*Reminder aktif:*\n${lines}`)
      return
    }

    // /ask or plain text → agent with progressive status edits
    if (cmd === '/ask' || (!cmd.startsWith('/') && text.length > 1)) {
      const body = cmd === '/ask' ? arg : text
      if (!body) return reply(chatId, 'Tulis pertanyaanmu, contoh: `/ask grafik BBCA 3 bulan`')

      const pend = pendingContext.get(chatId)
      const messages = pend
        ? [...pend.history, { role: 'user', content: body }]
        : [{ role: 'user', content: body }]
      const agent = pend ? findAgent(pend.agentId) : undefined
      await handleAgentTurn(chatId, message.from?.first_name, messages, agent ? { agent } : {})
      if (pend) pendingContext.delete(chatId)
      return
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
