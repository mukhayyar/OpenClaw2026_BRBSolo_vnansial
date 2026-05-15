/**
 * Client-side PIN handling.
 *
 * The PIN is stored in `sessionStorage` (cleared when the browser tab
 * closes). We never persist it to localStorage. The PIN is sent with
 * personal API calls via the `x-vnansial-pin` header, and threaded into
 * agent chat requests via the body so SQLite-backed tools can use it.
 */

const KEY = 'vnansial-pin'

export function getPin(): string {
  try {
    return sessionStorage.getItem(KEY) || ''
  } catch {
    return ''
  }
}

export function setPin(pin: string) {
  try {
    if (pin) sessionStorage.setItem(KEY, pin)
    else sessionStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}

export function clearPin() {
  setPin('')
}

export function pinHeader(): Record<string, string> {
  const p = getPin()
  return p ? { 'x-vnansial-pin': p } : {}
}

const API = import.meta.env.VITE_API_URL || ''

/** Returns true when the API confirms the PIN (or when PIN is not required). */
export async function verifyPin(pin: string): Promise<{ ok: boolean; mode?: string }> {
  try {
    const res = await fetch(`${API}/api/me/auth/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-vnansial-pin': pin },
      body: JSON.stringify({ pin }),
    })
    if (!res.ok) return { ok: false }
    const data = await res.json()
    return { ok: Boolean(data.ok), mode: data.mode }
  } catch {
    return { ok: false }
  }
}
