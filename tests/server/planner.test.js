import { describe, it, expect } from 'vitest'
import { calculateInvestmentGoal, suggestAssetAllocation } from '../../server/tools/planner.js'

describe('planner tools', () => {
  it('calculates investment goal projection', () => {
    const r = calculateInvestmentGoal({
      targetAmount: 10_000_000,
      months: 12,
      monthlyContribution: 500_000,
      expectedAnnualReturnPercent: 8,
    })
    expect(r.projectedEndBalance).toBeGreaterThan(0)
    expect(r.disclaimer).toMatch(/edukasi/i)
  })

  it('suggests balanced allocation', () => {
    const r = suggestAssetAllocation({ riskProfile: 'balanced' })
    expect(r.mix.stocks).toBe(40)
  })
})
