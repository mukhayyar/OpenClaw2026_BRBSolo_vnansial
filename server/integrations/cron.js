/**
 * Cron daemon.
 *
 * Polls every 30 s and dispatches:
 *  1. Price alerts (saham / crypto crossing target) → Telegram + cooldown
 *  2. Reminders due now → Telegram, mark fired
 *
 * Iterates every user that has an entry in `settings` (assumes self-host
 * 1–N user scale, not thousands).
 */

import {
  listAlerts,
  getSettings,
  listDueReminders,
  markReminderFired,
  markAlertFired,
} from '../lib/db.js'
import { getQuote } from '../lib/yahoo.js'
import { getCoinDetail } from '../lib/coingecko.js'

const POLL_INTERVAL_MS = 30_000
const COOLDOWN_MS = 60 * 60 * 1000
let started = false
let timer = null

async function fetchPrice(kind, symbol) {
  if (kind === 'saham') {
    const sym = symbol.includes('.') ? symbol : `${symbol}.JK`
    const q = await getQuote(sym)
    return q?.regularMarketPrice
  }
  if (kind === 'crypto') {
    const c = await getCoinDetail(String(symbol).toLowerCase())
    return c?.price
  }
  return null
}

async function notifyTelegram(chatId, text) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token || !chatId) return false
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      }),
    })
    return res.ok
  } catch {
    return false
  }
}

async function tick() {
  try {
    // Step 1: alerts (iterate likely user ids — self-host scale)
    for (let userId = 1; userId <= 10; userId++) {
      const rows = listAlerts(userId, true)
      if (!rows.length) continue
      const settings = getSettings(userId)
      const chatId = settings?.telegram_chat_id
      for (const a of rows) {
        if (a.last_fired_at && Date.now() - a.last_fired_at < COOLDOWN_MS) continue
        const price = await fetchPrice(a.kind, a.symbol)
        if (!Number.isFinite(price)) continue
        const triggered =
          (a.condition === 'above' && price > a.target) ||
          (a.condition === 'below' && price < a.target)
        if (!triggered) continue
        const msg =
          `🔔 *Alert Vnansial*\n` +
          `${a.kind === 'crypto' ? '🪙' : '📈'} *${a.symbol}* ${a.condition === 'above' ? 'di atas' : 'di bawah'} ${a.target}\n` +
          `Harga sekarang: *${price.toLocaleString('id-ID')}*`
        const sent = await notifyTelegram(chatId, msg)
        console.log(`[cron] alert #${a.id} fired (telegram=${sent})`)
        markAlertFired(a.id)
      }
    }

    // Step 2: reminders due now
    const due = listDueReminders(Date.now())
    for (const r of due) {
      const settings = getSettings(r.user_id)
      const chatId = settings?.telegram_chat_id
      const body = `⏰ *Pengingat dari Vnansial*\n${r.message}`
      if (r.channel === 'telegram') {
        const sent = await notifyTelegram(chatId, body)
        console.log(`[cron] reminder #${r.id} sent via telegram=${sent}`)
      } else {
        console.log(`[cron] reminder #${r.id} marked for in-app delivery`)
      }
      markReminderFired(r.id)
    }
  } catch (err) {
    console.error('[cron] tick error', err.message)
  }
}

export function startCron() {
  if (started) return
  started = true
  console.log(`[cron] daemon starting (poll every ${POLL_INTERVAL_MS / 1000}s)`)
  timer = setInterval(tick, POLL_INTERVAL_MS)
  setTimeout(tick, 3_000)
}

export function stopCron() {
  if (timer) clearInterval(timer)
  started = false
}
