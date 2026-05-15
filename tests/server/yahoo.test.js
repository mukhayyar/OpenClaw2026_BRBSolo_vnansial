import { describe, it, expect, beforeEach } from 'vitest'
import { getQuote, searchSymbols, clearYahooCache } from '../../server/lib/yahoo.js'

describe('yahoo (mock)', () => {
  beforeEach(() => {
    process.env.YAHOO_MOCK = '1'
    clearYahooCache()
  })

  it('returns mock quote for BBCA.JK', async () => {
    const q = await getQuote('BBCA.JK')
    expect(q.symbol).toBe('BBCA.JK')
    expect(q.regularMarketPrice).toBeGreaterThan(0)
    expect(q.currency).toBe('IDR')
  })

  it('searches symbols', async () => {
    const r = await searchSymbols('bank')
    expect(r.results.length).toBeGreaterThan(0)
  })
})
