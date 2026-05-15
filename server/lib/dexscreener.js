/**
 * DexScreener — free public API for DEX-listed tokens including meme
 * coins not yet on CoinGecko. Useful as a "degen check" fallback.
 *
 * Docs: https://docs.dexscreener.com/api/reference
 * No key required. 5-minute cache.
 */

const BASE = 'https://api.dexscreener.com'
const CACHE_TTL_MS = 5 * 60 * 1000
const cache = new Map()

function getCache(key) {
  const e = cache.get(key)
  if (!e) return null
  if (Date.now() - e.at > CACHE_TTL_MS) {
    cache.delete(key)
    return null
  }
  return e.data
}
function setCache(key, data) {
  cache.set(key, { at: Date.now(), data })
}

async function dsFetch(path) {
  const ck = `ds:${path}`
  const hit = getCache(ck)
  if (hit) return hit
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) return { error: `DexScreener ${res.status}`, status: res.status }
    const data = await res.json()
    setCache(ck, data)
    return data
  } catch (err) {
    return { error: err.message || 'DexScreener failed' }
  }
}

/**
 * Search across all DEX chains for a token symbol or name.
 * Returns top pairs by liquidity.
 */
export async function searchDex(query) {
  const q = String(query || '').trim()
  if (!q) return { error: 'query required', pairs: [] }
  const data = await dsFetch(`/latest/dex/search?q=${encodeURIComponent(q)}`)
  if (data.error) return data
  const pairs = (data.pairs || [])
    .slice(0, 20)
    .map(p => ({
      chain: p.chainId,
      dex: p.dexId,
      pairAddress: p.pairAddress,
      baseToken: { symbol: p.baseToken?.symbol, name: p.baseToken?.name, address: p.baseToken?.address },
      quoteToken: p.quoteToken?.symbol,
      priceUsd: Number(p.priceUsd),
      liquidityUsd: p.liquidity?.usd,
      volume24h: p.volume?.h24,
      fdv: p.fdv,
      change24h: p.priceChange?.h24,
      ageMinutes: p.pairCreatedAt ? Math.round((Date.now() - p.pairCreatedAt) / 60_000) : null,
      url: p.url,
    }))
  return { query: q, pairs }
}

/**
 * Risk heuristic for DEX-listed (often meme) tokens.
 * Returns 0–100 + reasons.
 */
export function scoreDexRisk(pair) {
  if (!pair || pair.error) return { score: null, error: pair?.error || 'no pair' }
  let score = 0
  const reasons = []

  if (!pair.liquidityUsd || pair.liquidityUsd < 10_000) {
    score += 30
    reasons.push(`Likuiditas sangat tipis ($${Math.round((pair.liquidityUsd || 0) / 1000)}K) — slippage besar`)
  } else if (pair.liquidityUsd < 100_000) {
    score += 15
    reasons.push(`Likuiditas rendah ($${Math.round(pair.liquidityUsd / 1000)}K)`)
  }

  if (!pair.volume24h || pair.volume24h < 5_000) {
    score += 20
    reasons.push('Volume 24 jam sangat rendah — bisa jadi dead token')
  }

  if (pair.ageMinutes && pair.ageMinutes < 60 * 24) {
    score += 25
    reasons.push(`Pair berumur ${pair.ageMinutes} menit — sangat baru`)
  } else if (pair.ageMinutes && pair.ageMinutes < 60 * 24 * 7) {
    score += 12
    reasons.push(`Pair berumur ${Math.round(pair.ageMinutes / 60 / 24)} hari — masih baru`)
  }

  if (pair.change24h && Math.abs(pair.change24h) > 200) {
    score += 15
    reasons.push(`Volatilitas 24 jam ekstrim (${pair.change24h.toFixed(0)}%) — pump & dump?`)
  }

  if (pair.fdv && pair.fdv < 50_000) {
    score += 10
    reasons.push(`FDV sangat kecil ($${Math.round(pair.fdv / 1000)}K) — risiko rug-pull`)
  }

  score = Math.min(100, Math.max(0, score))
  const level =
    score >= 70 ? 'sangat_tinggi' :
    score >= 50 ? 'tinggi' :
    score >= 30 ? 'menengah' :
    score >= 15 ? 'rendah' : 'sangat_rendah'

  return {
    score,
    level,
    reasons: reasons.length ? reasons : ['Tidak ada red flag mayor.'],
    disclaimer:
      'DEX token sangat berisiko, terutama meme coin. Skor heuristik bukan audit smart contract. DYOR.',
  }
}

/** Combined — single call from agent. */
export async function assessDexToken({ query }) {
  const search = await searchDex(query)
  if (search.error) return search
  if (!search.pairs.length) return { error: 'Tidak ada pair ditemukan.', query }
  // Pick top-liquidity pair
  const top = search.pairs.sort((a, b) => (b.liquidityUsd || 0) - (a.liquidityUsd || 0))[0]
  return { query, pair: top, allPairs: search.pairs.slice(0, 5), risk: scoreDexRisk(top) }
}
