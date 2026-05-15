/**
 * Reminder tools — the agent can schedule a reminder ("ingatkan saya
 * bayar tagihan 5 menit lagi") which the cron daemon fires via Telegram
 * (or surfaces in app on next page load).
 *
 * Natural language: agent should resolve "in N minutes/hours/days" or a
 * specific datetime to a unix ms timestamp before calling.
 */

import { resolveUser } from '../lib/auth.js'
import { createReminder, listReminders, deleteReminder } from '../lib/db.js'

function pinErr() {
  return {
    error: 'pin_required',
    message: 'Reminder butuh PIN supaya tersimpan ke akunmu. Unlock di /settings.',
  }
}

function resolveFireAt(args) {
  if (args.fireAtMs) {
    const t = Number(args.fireAtMs)
    if (Number.isFinite(t) && t > Date.now() - 5000) return t
  }
  if (Number.isFinite(Number(args.minutesFromNow))) {
    return Date.now() + Number(args.minutesFromNow) * 60_000
  }
  if (Number.isFinite(Number(args.secondsFromNow))) {
    return Date.now() + Number(args.secondsFromNow) * 1000
  }
  if (args.fireAtISO) {
    const t = Date.parse(args.fireAtISO)
    if (Number.isFinite(t) && t > Date.now() - 5000) return t
  }
  return null
}

export function createUserReminder(args = {}) {
  const user = resolveUser(args.pin)
  if (!user) return pinErr()
  if (!args.message) return { error: 'message wajib.' }
  const fireAt = resolveFireAt(args)
  if (!fireAt) {
    return { error: 'Beri salah satu: minutesFromNow, secondsFromNow, fireAtMs (unix ms), atau fireAtISO.' }
  }
  const channel = args.channel === 'app' ? 'app' : 'telegram'
  const row = createReminder({ userId: user.id, message: String(args.message).slice(0, 1000), fireAt, channel })
  const delta = Math.round((fireAt - Date.now()) / 1000)
  return {
    ok: true,
    reminder: row,
    message:
      `Reminder dibuat — akan kirim "${row.message}" via ${channel} dalam ${delta} detik ` +
      `(${new Date(fireAt).toLocaleString('id-ID')}).`,
  }
}

export function listUserReminders({ pin, includeFired } = {}) {
  const user = resolveUser(pin)
  if (!user) return pinErr()
  return { reminders: listReminders(user.id, Boolean(includeFired)) }
}

export function deleteUserReminder({ pin, id } = {}) {
  const user = resolveUser(pin)
  if (!user) return pinErr()
  if (!id) return { error: 'id wajib.' }
  deleteReminder(id)
  return { ok: true, message: `Reminder #${id} dihapus.` }
}
