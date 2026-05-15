import { describe, it, expect } from 'vitest'
import { runTool } from '../../server/tools/runner.js'

describe('runTool', () => {
  it('runs check_investment_company', async () => {
    const r = await runTool('check_investment_company', { companyName: 'quotex' })
    expect(r.found).toBe(true)
    expect(r.company.status).toBe('ILEGAL')
  })

  it('runs calculate_loan', async () => {
    const r = await runTool('calculate_loan', {
      principal: 1000000,
      annualRatePercent: 12,
      months: 12,
    })
    expect(r.monthlyPayment).toBeDefined()
  })

  it('runs get_fraud_report_guide', async () => {
    const r = await runTool('get_fraud_report_guide', {})
    expect(r.steps?.length).toBeGreaterThan(0)
  })

  it('unknown tool returns error', async () => {
    const r = await runTool('nonexistent_tool', {})
    expect(r.error).toMatch(/Unknown tool/)
  })
})
