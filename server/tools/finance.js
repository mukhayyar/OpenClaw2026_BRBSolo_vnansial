/**
 * Tools for Hutang (debt) tracking + Auto-cashflow rules + Whitepapers
 * + Asset analysis.
 *
 * All write operations require PIN (via resolveUser).
 */

import { resolveUser } from '../lib/auth.js'
import {
  listDebts,
  createDebt,
  updateDebt,
  deleteDebt,
  listCashflowRules,
  createCashflowRule,
  updateCashflowRule,
  deleteCashflowRule,
} from '../lib/db.js'
import { lookupWhitepaper, addWhitepaper, listAllWhitepapers } from '../lib/whitepapers.js'

function pinErr() {
  return {
    error: 'pin_required',
    message: 'Akses data pribadi butuh PIN. Buka /settings untuk unlock.',
  }
}

// ----- Debt -------------------------------------------------------
export function getUserDebts({ pin } = {}) {
  const user = resolveUser(pin)
  if (!user) return pinErr()
  const rows = listDebts(user.id)
  const totalRemaining = rows.reduce((s, d) => s + Number(d.remaining || 0), 0)
  const totalMonthly = rows.reduce((s, d) => s + Number(d.monthly_payment || 0), 0)
  return { debts: rows, totalRemaining, totalMonthly }
}

export function addDebt(args = {}) {
  const user = resolveUser(args.pin)
  if (!user) return pinErr()
  if (!args.name || !Number.isFinite(Number(args.principal))) {
    return { error: 'name & principal wajib.' }
  }
  const row = createDebt({
    user_id: user.id,
    name: String(args.name),
    kind: args.kind || 'pinjaman',
    principal: Number(args.principal),
    remaining: Number(args.remaining ?? args.principal),
    monthly_payment: Number.isFinite(Number(args.monthlyPayment)) ? Number(args.monthlyPayment) : null,
    annual_rate: Number.isFinite(Number(args.annualRate)) ? Number(args.annualRate) : null,
    due_day: Number.isFinite(Number(args.dueDay)) ? Number(args.dueDay) : null,
  })
  return { ok: true, debt: row, message: `Hutang "${row.name}" tersimpan.` }
}

export function updateUserDebt(args = {}) {
  const user = resolveUser(args.pin)
  if (!user) return pinErr()
  if (!args.id) return { error: 'id wajib.' }
  const row = updateDebt(args.id, {
    name: args.name,
    kind: args.kind,
    principal: args.principal,
    remaining: args.remaining,
    monthly_payment: args.monthlyPayment,
    annual_rate: args.annualRate,
    due_day: args.dueDay,
  })
  return { ok: Boolean(row), debt: row }
}

export function removeDebt(args = {}) {
  const user = resolveUser(args.pin)
  if (!user) return pinErr()
  if (!args.id) return { error: 'id wajib.' }
  deleteDebt(args.id)
  return { ok: true, message: `Hutang #${args.id} dihapus.` }
}

// ----- Cashflow rules --------------------------------------------
function computeNextFire(rule, fromMs = Date.now()) {
  const d = new Date(fromMs)
  if (rule.schedule === 'daily') {
    d.setUTCDate(d.getUTCDate() + 1)
    d.setUTCHours(2, 0, 0, 0) // 09:00 WIB
    return d.getTime()
  }
  if (rule.schedule === 'weekly') {
    const dow = Number(rule.day_of_week ?? 1) // Monday default
    while (d.getUTCDay() !== dow) d.setUTCDate(d.getUTCDate() + 1)
    if (d.getTime() <= fromMs) d.setUTCDate(d.getUTCDate() + 7)
    d.setUTCHours(2, 0, 0, 0)
    return d.getTime()
  }
  // monthly default
  const day = Number(rule.day_of_month ?? 1)
  const target = new Date(d.getUTCFullYear(), d.getUTCMonth(), day, 2)
  if (target.getTime() <= fromMs) target.setUTCMonth(target.getUTCMonth() + 1)
  return target.getTime()
}

export function listUserCashflowRules({ pin } = {}) {
  const user = resolveUser(pin)
  if (!user) return pinErr()
  return { rules: listCashflowRules(user.id) }
}

export function createUserCashflowRule(args = {}) {
  const user = resolveUser(args.pin)
  if (!user) return pinErr()
  if (!args.category || !Number.isFinite(Number(args.amount))) {
    return { error: 'category & amount wajib.' }
  }
  if (!['income', 'expense'].includes(args.kind)) {
    return { error: 'kind harus "income" atau "expense".' }
  }
  const schedule = ['daily', 'weekly', 'monthly'].includes(args.schedule) ? args.schedule : 'monthly'
  const rule = {
    user_id: user.id,
    kind: args.kind,
    category: String(args.category),
    amount: Number(args.amount),
    schedule,
    day_of_month: schedule === 'monthly' ? Number(args.dayOfMonth ?? 1) : null,
    day_of_week: schedule === 'weekly' ? Number(args.dayOfWeek ?? 1) : null,
    note: args.note || null,
  }
  rule.next_fire_at = computeNextFire(rule)
  const row = createCashflowRule(rule)
  return {
    ok: true,
    rule: row,
    message:
      `Auto-cashflow tersimpan: ${args.kind === 'income' ? 'pemasukan' : 'pengeluaran'} ` +
      `${args.category} sebesar Rp${Number(args.amount).toLocaleString('id-ID')} (${schedule}). ` +
      `Jadwal berikutnya: ${new Date(rule.next_fire_at).toLocaleString('id-ID')}.`,
  }
}

export function toggleUserCashflowRule(args = {}) {
  const user = resolveUser(args.pin)
  if (!user) return pinErr()
  if (!args.id) return { error: 'id wajib.' }
  const row = updateCashflowRule(args.id, { active: args.active ? 1 : 0 })
  return { ok: Boolean(row), rule: row }
}

export function deleteUserCashflowRule(args = {}) {
  const user = resolveUser(args.pin)
  if (!user) return pinErr()
  if (!args.id) return { error: 'id wajib.' }
  deleteCashflowRule(args.id)
  return { ok: true, message: `Rule #${args.id} dihapus.` }
}

export { computeNextFire }

// ----- Whitepapers ----------------------------------------------
export function getTokenWhitepaper(args = {}) {
  const id = args.id
  if (!id) return { error: 'id wajib (mis. bitcoin atau BBCA).' }
  const row = lookupWhitepaper(id)
  if (!row) {
    return {
      error: 'whitepaper_not_found',
      message: `Belum ada whitepaper / fundamentals link untuk ${id}. Pakai upsert_whitepaper untuk tambahkan.`,
    }
  }
  return row
}

export function upsertTokenWhitepaper(args = {}) {
  if (!args.id || !args.url) return { error: 'id & url wajib.' }
  const row = addWhitepaper({
    id: String(args.id),
    kind: args.kind || 'crypto',
    name: args.name || null,
    url: String(args.url),
    summary: args.summary || null,
  })
  return { ok: true, whitepaper: row, message: `Whitepaper ${row.id} tersimpan.` }
}

export function listTokenWhitepapers() {
  return { whitepapers: listAllWhitepapers() }
}

// ----- Macro/micro analysis (LLM-side) ---------------------------
/**
 * Stub: returns a structured analysis stub + prompt skeleton. The
 * real analysis happens when the agent reads this result and weaves
 * in its own knowledge + tool calls (e.g. get_idx_company,
 * get_crypto_quote). We provide canonical macro/micro factors so the
 * model has a consistent framework.
 */
export function analyzeAsset(args = {}) {
  const kind = String(args.kind || '').toLowerCase()
  const symbol = String(args.symbol || '').trim()
  if (!kind || !symbol) return { error: 'kind & symbol wajib.' }

  const macroFactors = kind === 'saham'
    ? [
        'Suku bunga BI Rate & arah kebijakan moneter',
        'Inflasi & daya beli rupiah',
        'Pertumbuhan PDB Indonesia',
        'Harga komoditas yang relevan (kalau emiten sektor energi/tambang/CPO)',
        'Sentimen asing (foreign flow di IDX)',
        'Kebijakan pemerintah & APBN',
      ]
    : kind === 'crypto'
    ? [
        'Suku bunga The Fed & likuiditas global',
        'Sentimen risk-on / risk-off pasar US',
        'Regulasi crypto (SEC, OJK, MAS)',
        'Halving / supply schedule',
        'Adopsi institusional (ETF flow, korporasi)',
        'Korelasi dengan Bitcoin sebagai aset proxy',
      ]
    : [
        'Geopolitik global (perang, OPEC+, sanksi)',
        'Indeks dolar (DXY)',
        'Inventory & supply chain',
        'Permintaan dari konsumen besar (China, India)',
      ]

  const microFactors = kind === 'saham'
    ? [
        'Pendapatan & laba bersih kuartalan',
        'Margin operasi & EBITDA',
        'Debt-to-equity & beban bunga',
        'Dividend yield & payout ratio',
        'Manajemen & corporate governance',
        'Posisi kompetitif di sektornya',
      ]
    : kind === 'crypto'
    ? [
        'Tokenomics: supply, emisi, unlock schedule',
        'Tim & komunitas developer',
        'Tractor: TVL (kalau DeFi), pengguna aktif',
        'Roadmap & milestone teknologi',
        'Audit smart contract',
        'Likuiditas di exchange terbesar',
      ]
    : [
        'Produksi & cadangan',
        'Biaya marginal produksi',
        'Permintaan industri spesifik',
        'Substitusi & inovasi teknologi',
      ]

  return {
    kind,
    symbol,
    framework: {
      macro: macroFactors,
      micro: microFactors,
      sentiment: [
        'Berita 7 hari terakhir',
        'Analyst consensus terbaru',
        'Aktivitas sosial media (kalau crypto)',
        'Insider buying/selling',
      ],
      risks: [
        'Volatilitas tertinggi historis',
        'Worst-case drawdown 12 bulan',
        'Risiko regulasi spesifik',
        'Likuiditas exit',
      ],
    },
    instruction:
      `Gunakan framework ini untuk menyusun analisis ${symbol}. ` +
      `Panggil tool data terkait (get_idx_company / get_crypto_quote / get_market_quote / assess_crypto_scam_risk) ` +
      `untuk angka konkret. Sertakan disclaimer "bukan saran beli/jual" dan ` +
      `outlook 6-12 bulan dengan asumsi yang jelas. Format dengan heading Markdown.`,
    disclaimer:
      'Framework analisis edukasi. Bukan nasihat investasi berlisensi.',
  }
}
