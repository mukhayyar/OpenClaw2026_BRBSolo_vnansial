/**
 * PIN-based authentication for personal endpoints + agent tools.
 *
 * Trust model: single-user self-host. The owner sets `VNANSIAL_PIN` in
 * `.env`. Any client (web page or agent chat) that wants to touch
 * portfolio/health data must present the same PIN.
 *
 * - Header: `x-vnansial-pin: <pin>`
 * - Or query/body field: `pin: <pin>` (for chat tools)
 *
 * If `VNANSIAL_PIN` is empty, personal endpoints are *open* (dev mode).
 * This is logged at startup so it's never silently insecure in prod.
 */

import { ensureUser } from './db.js'

export const HAS_PIN = Boolean(process.env.VNANSIAL_PIN)

if (!HAS_PIN) {
  console.warn(
    '[auth] VNANSIAL_PIN not set — personal endpoints are unprotected (dev mode).',
  )
}

function readPin(req) {
  return (
    req.headers['x-vnansial-pin'] ||
    req.body?.pin ||
    req.query?.pin ||
    null
  )
}

export function checkPin(pin) {
  if (!HAS_PIN) return true
  return pin && String(pin) === String(process.env.VNANSIAL_PIN)
}

export function requirePin(req, res, next) {
  const pin = readPin(req)
  if (!checkPin(pin)) {
    return res.status(401).json({
      error: 'pin_required',
      hint: 'Sertakan header x-vnansial-pin atau field pin di body. Set VNANSIAL_PIN di .env.',
    })
  }
  // Attach the resolved local user so handlers can use it
  req.user = ensureUser({ nickname: 'self' })
  next()
}

/** Returns the local user (creating it) iff the PIN matches; null otherwise. */
export function resolveUser(pin) {
  if (!checkPin(pin)) return null
  return ensureUser({ nickname: 'self' })
}
