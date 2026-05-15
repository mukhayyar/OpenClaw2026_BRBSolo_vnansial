import { describe, it, expect } from 'vitest'
import {
  checkInvestmentCompany,
  calculateLoan,
  assessInvestmentRedFlags,
} from '../../server/tools/vnansial.js'

describe('checkInvestmentCompany', () => {
  it('finds illegal entity binomo', () => {
    const r = checkInvestmentCompany({ companyName: 'Binomo' })
    expect(r.found).toBe(true)
    expect(r.company.status).toBe('ILEGAL')
  })

  it('returns not found for unknown name', () => {
    const r = checkInvestmentCompany({ companyName: 'Unknown Corp XYZ' })
    expect(r.found).toBe(false)
  })

  it('requires company name', () => {
    const r = checkInvestmentCompany({ companyName: '' })
    expect(r.error).toBeTruthy()
  })
})

describe('calculateLoan', () => {
  it('computes anuitas loan', () => {
    const r = calculateLoan({
      principal: 5_000_000,
      annualRatePercent: 24,
      months: 12,
      method: 'anuitas',
    })
    expect(r.monthlyPayment).toBeGreaterThan(0)
    expect(r.verdict).toBe('warning')
  })

  it('flags predatory rate', () => {
    const r = calculateLoan({
      principal: 1_000_000,
      annualRatePercent: 120,
      months: 6,
    })
    expect(r.verdict).toBe('predatory')
  })
})

describe('assessInvestmentRedFlags', () => {
  it('high risk with many flags', () => {
    const r = assessInvestmentRedFlags({ checkedIndices: [0, 1, 2, 3, 4] })
    expect(r.riskLevel).toBe('high')
  })
})
