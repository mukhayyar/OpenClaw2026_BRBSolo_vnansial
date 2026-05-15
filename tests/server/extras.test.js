import { describe, it, expect } from 'vitest'
import { calculatePremium, recommendInsurance, listInsuranceCompanies } from '../../server/lib/insurance.js'
import { scoreCoinRisk } from '../../server/lib/coingecko.js'

describe('insurance', () => {
  it('lists companies', () => {
    const r = listInsuranceCompanies()
    expect(r.companies.length).toBeGreaterThan(0)
  })

  it('filters by type', () => {
    const r = listInsuranceCompanies('kesehatan')
    expect(r.companies.every(c => c.type === 'kesehatan')).toBe(true)
  })

  it('calculates premium for jiwa', () => {
    const r = calculatePremium({ type: 'jiwa', coverage: 500_000_000, age: 30 })
    expect(r.monthlyPremiumIDR).toBeGreaterThan(0)
    expect(r.disclaimer).toBeDefined()
  })

  it('rejects unknown insurance type', () => {
    const r = calculatePremium({ type: 'xx', coverage: 100 })
    expect(r.error).toBeDefined()
  })

  it('recommends asuransi for a parent with car', () => {
    const r = recommendInsurance({ age: 35, monthlyIncome: 10_000_000, dependents: 2, hasHealth: false, hasCar: true })
    expect(r.recommendations.length).toBeGreaterThanOrEqual(2)
  })
})

describe('crypto risk', () => {
  it('flags small-cap new coin as high risk', () => {
    const r = scoreCoinRisk({
      id: 'newcoin',
      symbol: 'NEW',
      genesisDate: new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10),
      marketCap: 500_000,
      volume24h: 1_000,
      homepage: [],
      change30d: 800,
    })
    expect(r.score).toBeGreaterThanOrEqual(60)
    expect(r.level === 'tinggi' || r.level === 'sangat_tinggi').toBe(true)
  })

  it('rates a blue-chip coin low risk', () => {
    const r = scoreCoinRisk({
      id: 'bitcoin',
      symbol: 'BTC',
      genesisDate: '2009-01-03',
      marketCap: 1.6e12,
      volume24h: 4.5e10,
      homepage: ['https://bitcoin.org'],
      change30d: 5,
    })
    expect(r.score).toBeLessThanOrEqual(20)
  })
})
