/**
 * Agent-callable portfolio + health-snapshot tools.
 *
 * Each tool takes a `pin` argument. The runner validates the pin against
 * `VNANSIAL_PIN`; without a match we refuse and return a structured error.
 * The agent should then tell the user to unlock their data first.
 */

import { resolveUser } from '../lib/auth.js'
import {
  upsertHolding,
  deleteHolding,
  listHoldings,
  upsertBuffer,
  listBuffers,
  saveHealthSnapshot,
  listHealthSnapshots,
} from '../lib/db.js'
import { scoreFinancialHealth } from './health.js'

function pinError() {
  return {
    error: 'pin_required',
    message:
      'Akses portofolio/data pribadi butuh PIN. Buka halaman Portofolio/Kesehatan dan unlock dulu.',
  }
}

const VALID_KINDS = new Set(['saham', 'crypto', 'reksadana', 'obligasi', 'logam'])
const VALID_BUFFERS = new Set(['emergency', 'money_buffer', 'savings'])

export function getUserPortfolio({ pin } = {}) {
  const user = resolveUser(pin)
  if (!user) return pinError()
  return {
    user: { id: user.id, nickname: user.nickname },
    holdings: listHoldings(user.id),
    buffers: listBuffers(user.id),
  }
}

export function addPortfolioHolding({ pin, kind, symbol, amount, costBasis } = {}) {
  const user = resolveUser(pin)
  if (!user) return pinError()
  if (!VALID_KINDS.has(kind)) return { error: `kind harus salah satu: ${[...VALID_KINDS].join(', ')}` }
  if (!symbol) return { error: 'symbol wajib' }
  if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) return { error: 'amount harus angka positif' }
  const row = upsertHolding({
    userId: user.id,
    kind,
    symbol: String(symbol).toUpperCase(),
    amount: Number(amount),
    costBasis: Number.isFinite(Number(costBasis)) ? Number(costBasis) : null,
  })
  return { ok: true, holding: row, message: `Holding ${row.symbol} (${kind}) tersimpan.` }
}

export function removePortfolioHolding({ pin, kind, symbol } = {}) {
  const user = resolveUser(pin)
  if (!user) return pinError()
  if (!kind || !symbol) return { error: 'kind & symbol wajib' }
  deleteHolding({ userId: user.id, kind, symbol: String(symbol).toUpperCase() })
  return { ok: true, message: `Holding ${symbol} (${kind}) dihapus.` }
}

export function updateMoneyBuffer({ pin, kind, amount, target } = {}) {
  const user = resolveUser(pin)
  if (!user) return pinError()
  if (!VALID_BUFFERS.has(kind)) return { error: `kind harus salah satu: ${[...VALID_BUFFERS].join(', ')}` }
  const row = upsertBuffer({
    userId: user.id,
    kind,
    amount: Number(amount) || 0,
    target: Number.isFinite(Number(target)) ? Number(target) : null,
  })
  return { ok: true, buffer: row, message: `Buffer ${kind} di-update.` }
}

export function saveHealthScore(args = {}) {
  const user = resolveUser(args.pin)
  if (!user) return pinError()
  const result = scoreFinancialHealth(args)
  if (result.error) return result
  const snap = saveHealthSnapshot({ userId: user.id, score: result.score, payload: { input: args, result } })
  return {
    ok: true,
    snapshotId: snap.id,
    score: result.score,
    overall: result.overall,
    recommendations: result.recommendations,
    message: `Skor ${result.score}/100 (${result.overall}) tersimpan.`,
  }
}

export function listHealthHistory({ pin, limit = 12 } = {}) {
  const user = resolveUser(pin)
  if (!user) return pinError()
  return {
    snapshots: listHealthSnapshots(user.id, Number(limit) || 12).map(s => ({
      id: s.id,
      score: s.score,
      at: s.created_at,
    })),
  }
}
