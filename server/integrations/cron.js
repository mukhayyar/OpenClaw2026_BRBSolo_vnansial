/**
 * Cron daemon — polls every 30 s and dispatches:
 *   1. Price alerts (saham / crypto crossing target)
 *   2. Reminders due now
 *   3. Auto-cashflow rules due now (insert cashflow entry + notify Telegram)
 *
 * Self-host scale assumed (iterates user ids 1..10). For bigger scale,
 * swap to "SELECT DISTINCT user_id FROM ..." style queries.
 */

import {
  listAlerts,
  getSettings,
  listDueReminders,
  markReminderFired,
  markAlertFired,
  listDueCashflowRules,
  updateCashflowRule,
} from '../lib/db.js'
import { getQuote } from '../lib/yahoo.js'
import { getCoinDetail } from '../lib/coingecko.js'
import { computeNextFire } from '../tools/finance.js'

const POLL_INTERVAL_MS = 30_000
const ALERT_COOLDOWN_MS = 60 * 60 * 1000
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

function fmtIDR(n) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(n) || 0)
}

async function tick() {
  try {
    // 1) Alerts
    for (let userId = 1; userId <= 10; userId++) {
      const rows = listAlerts(userId, true)
      if (!rows.length) continue
      const settings = getSettings(userId)
      const chatId = settings?.telegram_chat_id
      for (const a of rows) {
        if (a.last_fired_at && Date.now() - a.last_fired_at < ALERT_COOLDOWN_MS) continue
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

    // 2) Reminders
    const dueReminders = listDueReminders(Date.now())
    for (const r of dueReminders) {
      const settings = getSettings(r.user_id)
      const chatId = settings?.telegram_chat_id
      const body = `⏰ *Pengingat dari Vnansial*\n${r.message}`
      if (r.channel === 'telegram') {
        const sent = await notifyTelegram(chatId, body)
        console.log(`[cron] reminder #${r.id} sent via telegram=${sent}`)
      }
      markReminderFired(r.id)
    }

    // 3) Auto-cashflow rules
    const dueRules = listDueCashflowRules(Date.now())
    for (const rule of dueRules) {
      const settings = getSettings(rule.user_id)
      const chatId = settings?.telegram_chat_id
      const sign = rule.kind === 'income' ? '+' : '−'
      const emoji = rule.kind === 'income' ? '💰' : '💳'
      const body =
        `${emoji} *Auto cashflow*\n` +
        `${rule.category}: *${sign}${fmtIDR(rule.amount)}*\n` +
        (rule.note ? `_${rule.note}_\n` : '') +
        `Jadwal: ${rule.schedule}`
      await notifyTelegram(chatId, body)
      // Reschedule
      const nextFire = computeNextFire(rule, Date.now())
      updateCashflowRule(rule.id, { last_fired_at: Date.now(), next_fire_at: nextFire })
      console.log(`[cron] cashflow rule #${rule.id} fired, next at ${new Date(nextFire).toISOString()}`)
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
