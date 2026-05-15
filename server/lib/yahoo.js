/**
 * Yahoo Finance data via yahoo-finance2 (unofficial).
 * In-memory cache 60s. Set YAHOO_MOCK=1 for deterministic offline responses.
 */

const CACHE_TTL_MS = 60_000
const cache = new Map()

function cacheKey(kind, key) {
  return `${kind}:${key}`
}

function getCached(key) {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() - entry.at > CACHE_TTL_MS) {
    cache.delete(key)
    return null
  }
  return entry.data
}

function setCache(key, data) {
  cache.set(key, { at: Date.now(), data })
}

function mockQuote(symbol) {
  const s = symbol.toUpperCase()
  const base = s.includes('BBCA') ? 9500 : s.includes('AAPL') ? 190 : 100
  return {
    symbol: s,
    shortName: `Mock ${s}`,
    currency: s.endsWith('.JK') ? 'IDR' : 'USD',
    regularMarketPrice: base,
    regularMarketChange: base * 0.01,
    regularMarketChangePercent: 1.0,
    marketCap: base * 1e9,
    exchange: s.endsWith('.JK') ? 'JKT' : 'NMS',
    marketState: 'REGULAR',
    disclaimer: 'MOCK_DATA',
  }
}

let yfInstance = null

async function getYahoo() {
  if (process.env.YAHOO_MOCK === '1') return null
  if (!yfInstance) {
    const mod = await import('yahoo-finance2')
    const YahooFinance = mod.default || mod
    // v2.14+ requires instantiation. Older versions exported a ready instance.
    try {
      yfInstance = typeof YahooFinance === 'function' ? new YahooFinance() : YahooFinance
    } catch {
      yfInstance = YahooFinance
    }
    // Suppress upstream notices that flood logs
    try {
      yfInstance.suppressNotices?.(['yahooSurvey'])
    } catch {}
  }
  return yfInstance
}

export function normalizeSymbol(symbol) {
  return String(symbol || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '')
}

export async function getQuote(symbol) {
  const sym = normalizeSymbol(symbol)
  if (!sym) return { error: 'symbol required' }

  const ck = cacheKey('quote', sym)
  const hit = getCached(ck)
  if (hit) return { ...hit, cached: true }

  if (process.env.YAHOO_MOCK === '1') {
    const data = mockQuote(sym)
    setCache(ck, data)
    return { ...data, cached: false }
  }

  try {
    const yf = await getYahoo()
    const q = await yf.quote(sym)
    if (!q) return { error: 'Symbol not found', symbol: sym }

    const data = {
      symbol: q.symbol || sym,
      shortName: q.shortName || q.longName || sym,
      currency: q.currency || 'USD',
      regularMarketPrice: q.regularMarketPrice ?? q.postMarketPrice,
      regularMarketChange: q.regularMarketChange,
      regularMarketChangePercent: q.regularMarketChangePercent,
      marketCap: q.marketCap,
      exchange: q.fullExchangeName || q.exchange,
      marketState: q.marketState,
      fiftyTwoWeekHigh: q.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: q.fiftyTwoWeekLow,
      disclaimer: 'Data from Yahoo Finance (may be delayed). Not financial advice.',
    }
    setCache(ck, data)
    return { ...data, cached: false }
  } catch (err) {
    return { error: err.message || 'Failed to fetch quote', symbol: sym }
  }
}

export async function searchSymbols(query) {
  const q = String(query || '').trim()
  if (!q) return { error: 'query required', results: [] }

  const ck = cacheKey('search', q.toLowerCase())
  const hit = getCached(ck)
  if (hit) return { ...hit, cached: true }

  if (process.env.YAHOO_MOCK === '1') {
    const data = {
      query: q,
      results: [
        { symbol: 'BBCA.JK', shortName: 'Bank Central Asia Tbk', exchange: 'JKT' },
        { symbol: 'AAPL', shortName: 'Apple Inc.', exchange: 'NMS' },
      ].filter(r => r.shortName.toLowerCase().includes(q.toLowerCase()) || r.symbol.includes(q.toUpperCase())),
      disclaimer: 'MOCK_DATA',
    }
    setCache(ck, data)
    return data
  }

  try {
    const yf = await getYahoo()
    const res = await yf.search(q, { quotesCount: 8, newsCount: 0 })
    const results = (res.quotes || [])
      .filter(x => x.symbol)
      .map(x => ({
        symbol: x.symbol,
        shortName: x.shortname || x.longname || x.symbol,
        exchange: x.exchange,
        type: x.quoteType,
      }))
    const data = { query: q, results, disclaimer: 'Yahoo Finance search — verify symbol before trading.' }
    setCache(ck, data)
    return { ...data, cached: false }
  } catch (err) {
    return { error: err.message, query: q, results: [] }
  }
}

export async function getHistorical(symbol, range = '3mo') {
  const sym = normalizeSymbol(symbol)
  if (!sym) return { error: 'symbol required', points: [] }

  const ck = cacheKey('hist', `${sym}:${range}`)
  const hit = getCached(ck)
  if (hit) return { ...hit, cached: true }

  if (process.env.YAHOO_MOCK === '1') {
    const points = Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 86400000).toISOString().slice(0, 10),
      close: 100 + i * 0.5,
    }))
    const data = { symbol: sym, range, points, disclaimer: 'MOCK_DATA' }
    setCache(ck, data)
    return data
  }

  try {
    const yf = await getYahoo()
    const period2 = new Date()
    const period1 = new Date()
    if (range === '1mo') period1.setMonth(period1.getMonth() - 1)
    else if (range === '6mo') period1.setMonth(period1.getMonth() - 6)
    else if (range === '1y') period1.setFullYear(period1.getFullYear() - 1)
    else period1.setMonth(period1.getMonth() - 3)

    // yahoo-finance2 v2.x: historical() was removed; use chart().
    // Fall back to historical() for older installs if available.
    let rawRows = []
    if (typeof yf.chart === 'function') {
      const result = await yf.chart(sym, {
        period1,
        period2,
        interval: '1d',
      })
      rawRows = (result?.quotes || []).map(r => ({
        date: r.date,
        open: r.open,
        high: r.high,
        low: r.low,
        close: r.close ?? r.adjclose,
        volume: r.volume,
      }))
    } else if (typeof yf.historical === 'function') {
      rawRows = await yf.historical(sym, { period1, period2, interval: '1d' })
    } else {
      return { error: 'yahoo-finance2 has no chart() or historical() — update the dependency', symbol: sym, points: [] }
    }
    const points = (rawRows || [])
      .filter(r => r && r.date != null && r.close != null)
      .map(r => ({
        date: r.date instanceof Date ? r.date.toISOString().slice(0, 10) : String(r.date),
        close: r.close,
        open: r.open,
        high: r.high,
        low: r.low,
        volume: r.volume,
      }))
    const data = {
      symbol: sym,
      range,
      points,
      disclaimer: 'Historical data delayed. Educational use only.',
    }
    setCache(ck, data)
    return { ...data, cached: false }
  } catch (err) {
    return { error: err.message, symbol: sym, points: [] }
  }
}

/**
 * USD/IDR exchange rate. Cached 5 min. Falls back to 16000 if upstream fails.
 */
export async function getUsdIdr() {
  const ck = cacheKey('fx', 'USDIDR')
  const hit = getCached(ck)
  if (hit) return { ...hit, cached: true }
  try {
    const q = await getQuote('IDR=X')
    const rate = q?.regularMarketPrice
    if (Number.isFinite(rate)) {
      const data = { rate, asOf: Date.now(), source: 'yahoo' }
      setCache(ck, data)
      return data
    }
  } catch {}
  // Fallback estimate
  return { rate: 16000, asOf: Date.now(), source: 'fallback' }
}

/** Clear cache (tests) */
export function clearYahooCache() {
  cache.clear()
}
