import { describe, it, expect } from 'vitest'
import { scoreFinancialHealth } from '../../server/tools/health.js'

describe('scoreFinancialHealth', () => {
  it('returns error when no income/expense provided', () => {
    const r = scoreFinancialHealth({})
    expect(r.error).toBeDefined()
  })

  it('produces a numeric score in 0..100', () => {
    const r = scoreFinancialHealth({
      monthlyIncome: 10_000_000,
      monthlyExpense: 6_000_000,
      emergencyFund: 30_000_000,
      totalDebt: 5_000_000,
      monthlySavings: 2_000_000,
    })
    expect(typeof r.score).toBe('number')
    expect(r.score).toBeGreaterThanOrEqual(0)
    expect(r.score).toBeLessThanOrEqual(100)
    expect(r.overall).toBeDefined()
    expect(r.pillars.budget.score).toBeLessThanOrEqual(25)
    expect(r.pillars.emergencyFund.score).toBeLessThanOrEqual(25)
    expect(r.pillars.debt.score).toBeLessThanOrEqual(25)
    expect(r.pillars.savings.score).toBeLessThanOrEqual(25)
  })

  it('rates a healthy profile high', () => {
    const r = scoreFinancialHealth({
      monthlyIncome: 20_000_000,
      monthlyExpense: 7_000_000,
      emergencyFund: 60_000_000,
      totalDebt: 0,
      monthlySavings: 5_000_000,
    })
    expect(r.score).toBeGreaterThanOrEqual(75)
  })

  it('rates a defisit profile low', () => {
    const r = scoreFinancialHealth({
      monthlyIncome: 5_000_000,
      monthlyExpense: 7_000_000,
      emergencyFund: 0,
      totalDebt: 100_000_000,
      monthlySavings: 0,
    })
    expect(r.score).toBeLessThan(30)
    expect(r.recommendations.length).toBeGreaterThan(0)
  })

  it('always includes a disclaimer', () => {
    const r = scoreFinancialHealth({ monthlyIncome: 5_000_000, monthlyExpense: 3_000_000 })
    expect(r.disclaimer).toBeDefined()
  })
})
