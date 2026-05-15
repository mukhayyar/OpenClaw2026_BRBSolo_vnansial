/**
 * Data persistence tools — AI can save/query cashflow entries and
 * cross-reference user data across tables.
 */

import { resolveUser } from '../lib/auth.js'
import {
  listCashflowEntries,
  createCashflowEntry,
  deleteCashflowEntry,
  listHoldings,
  listBuffers,
  listDebts,
  listCashflowRules,
} from '../lib/db.js'

function pinErr() {
  return {
    error: 'pin_required',
    message: 'Akses data pribadi butuh PIN. Buka halaman Portofolio dan unlock dulu.',
  }
}

export function saveCashflowEntry(args = {}) {
  const user = resolveUser(args.pin)
  if (!user) return pinErr()
  if (!args.date || !args.category || !args.type || !Number.isFinite(Number(args.amount))) {
    return { error: 'date, category, type, amount wajib.' }
  }
  if (!['income', 'expense'].includes(args.type)) {
    return { error: 'type harus income atau expense.' }
  }
  const row = createCashflowEntry({
    user_id: user.id,
    date: String(args.date),
    category: String(args.category),
    type: args.type,
    amount: Number(args.amount),
    note: args.note || null,
    source: 'ai',
  })
  return {
    ok: true,
    entry: row,
    message: `Cashflow ${args.type === 'income' ? 'pemasukan' : 'pengeluaran'} "${args.category}" sebesar Rp${Number(args.amount).toLocaleString('id-ID')} tercatat untuk ${args.date}.`,
  }
}

export function listUserCashflowEntries(args = {}) {
  const user = resolveUser(args.pin)
  if (!user) return pinErr()
  const limit = Number(args.limit) || 100
  const entries = listCashflowEntries(user.id, limit)
  const income = entries.filter(e => e.type === 'income').reduce((s, e) => s + Number(e.amount), 0)
  const expense = entries.filter(e => e.type === 'expense').reduce((s, e) => s + Number(e.amount), 0)
  return {
    entries,
    summary: { totalIncome: income, totalExpense: expense, net: income - expense },
  }
}

export function deleteUserCashflowEntry(args = {}) {
  const user = resolveUser(args.pin)
  if (!user) return pinErr()
  if (!args.id) return { error: 'id wajib.' }
  deleteCashflowEntry(Number(args.id))
  return { ok: true, message: `Cashflow entry #${args.id} dihapus.` }
}

/**
 * Cross-reference all user data for a complete snapshot.
 * Useful when the AI wants to understand the user's full financial picture
 * before giving advice.
 */
export function findUserData(args = {}) {
  const user = resolveUser(args.pin)
  if (!user) return pinErr()
  const holdings = listHoldings(user.id)
  const buffers = listBuffers(user.id)
  const debts = listDebts(user.id)
  const rules = listCashflowRules(user.id)
  const entries = listCashflowEntries(user.id, 50)

  const totalHoldings = holdings.reduce((s, h) => s + (Number(h.cost_basis) || 0) * Number(h.amount), 0)
  const totalBuffers = buffers.reduce((s, b) => s + Number(b.amount || 0), 0)
  const totalDebt = debts.reduce((s, d) => s + Number(d.remaining || 0), 0)
  const monthlyDebt = debts.reduce((s, d) => s + Number(d.monthly_payment || 0), 0)
  const incomeRules = rules.filter(r => r.kind === 'income' && r.active)
  const expenseRules = rules.filter(r => r.kind === 'expense' && r.active)
  const monthlyIncome = incomeRules.reduce((s, r) => s + Number(r.amount), 0)
  const monthlyExpense = expenseRules.reduce((s, r) => s + Number(r.amount), 0)

  return {
    user: { id: user.id, nickname: user.nickname },
    holdings,
    buffers,
    debts,
    cashflowRules: rules,
    recentCashflowEntries: entries,
    summary: {
      totalHoldingsCost: totalHoldings,
      totalBuffers,
      totalDebt,
      monthlyDebtPayment: monthlyDebt,
      monthlyIncomeFromRules: monthlyIncome,
      monthlyExpenseFromRules: monthlyExpense,
      netMonthlyFromRules: monthlyIncome - monthlyExpense,
      netWorth: totalHoldings + totalBuffers - totalDebt,
    },
  }
}
