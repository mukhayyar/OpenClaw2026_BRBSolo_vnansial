/**
 * Agent-callable alert tools — create/list/delete price alerts for the
 * authenticated user. Cron daemon polls active alerts and notifies via
 * Telegram when the condition is met.
 *
 * All operations require PIN (via the agent loop's ctx.pin injection).
 */

import { resolveUser } from '../lib/auth.js'
import { createAlert, listAlerts, deleteAlert } from '../lib/db.js'

function pinErr() {
  return {
    error: 'pin_required',
    message: 'Akses alert butuh PIN. Buka /settings dan unlock dulu.',
  }
}

const VALID_KINDS = new Set(['saham', 'crypto'])
const VALID_CONDITIONS = new Set(['above', 'below'])

export function createPriceAlert({ pin, kind, symbol, condition, target } = {}) {
  const user = resolveUser(pin)
  if (!user) return pinErr()
  if (!VALID_KINDS.has(kind)) return { error: `kind harus salah satu: ${[...VALID_KINDS].join(', ')}` }
  if (!VALID_CONDITIONS.has(condition)) return { error: `condition harus 'above' atau 'below'` }
  if (!symbol || !Number.isFinite(Number(target))) return { error: 'symbol & target wajib' }
  const row = createAlert({
    userId: user.id,
    kind,
    symbol: String(symbol).toUpperCase(),
    condition,
    target: Number(target),
  })
  return {
    ok: true,
    alert: row,
    message: `Alert dibuat: ${kind.toUpperCase()} ${symbol} ${condition} ${target}. Cron daemon akan cek setiap menit.`,
  }
}

export function listUserAlerts({ pin } = {}) {
  const user = resolveUser(pin)
  if (!user) return pinErr()
  return { alerts: listAlerts(user.id) }
}

export function deleteUserAlert({ pin, id } = {}) {
  const user = resolveUser(pin)
  if (!user) return pinErr()
  if (!id) return { error: 'id wajib' }
  deleteAlert(id)
  return { ok: true, message: `Alert #${id} dihapus.` }
}
