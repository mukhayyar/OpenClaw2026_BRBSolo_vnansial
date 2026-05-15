/**
 * CoinGecko proxy with a simple heuristic scam/risk score.
 *
 * Public API, no key needed (rate-limited to 30 req/min). We cache 60 s.
 *
 * Risk heuristic (probability of scam/red-flag, 0–100, higher = riskier):
 *  +30 if coin is younger than 365 days
 *  +25 if market cap < $1M
 *  +15 if 24h volume < $50k
 *  +10 if no homepage URL
 *  +10 if symbol appears in known scam list
 *  +10 if 30-day price change > +500% or < -90%
 * Clamp to 0–100. Anything ≥60 is "very high risk".
 */

const BASE = 'https://api.coingecko.com/api/v3'
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 min — be a friendly client
const STALE_TTL_MS = 60 * 60 * 1000 // serve stale on 429 up to 1h
const cache = new Map()

function getCache(key, allowStale = false) {
  const e = cache.get(key)
  if (!e) return null
  const age = Date.now() - e.at
  if (age <= CACHE_TTL_MS) return { data: e.data, stale: false }
  if (allowStale && age <= STALE_TTL_MS) return { data: e.data, stale: true }
  return null
}
function setCache(key, data) {
  cache.set(key, { at: Date.now(), data })
}

// Static fallback for the top-coins page when CoinGecko hard-blocks.
// Numbers updated periodically; not live. Lets the UI render *something*.
const FALLBACK_TOP = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', price: 80000, marketCap: 1.6e12, volume24h: 4.5e10, change24h: 1.2, change30d: 8.5, image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png', rank: 1 },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', price: 2250, marketCap: 2.7e11, volume24h: 1.8e10, change24h: -0.2, change30d: -2.7, image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png', rank: 2 },
  { id: 'tether', symbol: 'USDT', name: 'Tether', price: 1, marketCap: 1.9e11, volume24h: 7.5e10, change24h: 0, change30d: 0, image: 'https://assets.coingecko.com/coins/images/325/large/Tether.png', rank: 3 },
  { id: 'binancecoin', symbol: 'BNB', name: 'BNB', price: 590, marketCap: 8.6e10, volume24h: 1.2e9, change24h: 0.5, change30d: 3.1, image: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png', rank: 4 },
  { id: 'solana', symbol: 'SOL', name: 'Solana', price: 165, marketCap: 7.7e10, volume24h: 2.4e9, change24h: 1.8, change30d: 12.4, image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png', rank: 5 },
  { id: 'usd-coin', symbol: 'USDC', name: 'USDC', price: 1, marketCap: 4.0e10, volume24h: 5.2e9, change24h: 0, change30d: 0.1, image: 'https://assets.coingecko.com/coins/images/6319/large/usdc.png', rank: 6 },
  { id: 'ripple', symbol: 'XRP', name: 'XRP', price: 2.1, marketCap: 1.2e11, volume24h: 3.0e9, change24h: -0.4, change30d: -5.2, image: 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png', rank: 7 },
  { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin', price: 0.16, marketCap: 2.4e10, volume24h: 6.5e8, change24h: 2.1, change30d: -8.3, image: 'https://assets.coingecko.com/coins/images/5/large/dogecoin.png', rank: 8 },
  { id: 'cardano', symbol: 'ADA', name: 'Cardano', price: 0.65, marketCap: 2.3e10, volume24h: 4.1e8, change24h: 0.8, change30d: -3.4, image: 'https://assets.coingecko.com/coins/images/975/large/cardano.png', rank: 9 },
  { id: 'tron', symbol: 'TRX', name: 'TRON', price: 0.21, marketCap: 1.8e10, volume24h: 5.5e8, change24h: 0.4, change30d: 1.2, image: 'https://assets.coingecko.com/coins/images/1094/large/tron-logo.png', rank: 10 },
  { id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche', price: 23, marketCap: 9.5e9, volume24h: 2.8e8, change24h: 0.6, change30d: -6.1, image: 'https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png', rank: 11 },
  { id: 'chainlink', symbol: 'LINK', name: 'Chainlink', price: 16, marketCap: 1.0e10, volume24h: 3.5e8, change24h: 1.4, change30d: 5.8, image: 'https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png', rank: 12 },
]

// Known scam / rug-pull coins (curated, expand over time)
const SCAM_LIST = new Set([
  'safemoon', 'bitconnect', 'onecoin', 'plustoken', 'pincoin', 'tron-trx-clone',
  'squidgame', 'squid-game', 'luna', 'terraluna',
])

async function cgFetch(path) {
  const ck = `cg:${path}`
  const hit = getCache(ck, false)
  if (hit) {
    const d = hit.data
    return Array.isArray(d) ? d : { ...d, cached: true }
  }
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { Accept: 'application/json' },
    })
    if (res.status === 429 || res.status >= 500) {
      const stale = getCache(ck, true)
      if (stale) {
        const d = stale.data
        return Array.isArray(d) ? d : { ...d, cached: true, stale: true }
      }
      return { error: `CoinGecko ${res.status}`, status: res.status }
    }
    if (!res.ok) return { error: `CoinGecko ${res.status}`, status: res.status }
    const data = await res.json()
    setCache(ck, data)
    return Array.isArray(data) ? data : { ...data, cached: false }
  } catch (err) {
    const stale = getCache(ck, true)
    if (stale) {
      const d = stale.data
      return Array.isArray(d) ? d : { ...d, cached: true, stale: true }
    }
    return { error: err.message || 'CoinGecko request failed' }
  }
}

export async function getTopCoins(limit = 50) {
  const res = await cgFetch(
    `/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&price_change_percentage=30d`,
  )
  if (!Array.isArray(res)) {
    // Serve fallback so the UI never appears blank
    return {
      coins: FALLBACK_TOP.slice(0, limit),
      source: 'fallback',
      hint: res.error || 'CoinGecko unavailable',
      disclaimer: 'Data fallback statis (CoinGecko rate-limit). Refresh untuk coba live.',
    }
  }
  return {
    coins: res.map(c => ({
      id: c.id,
      symbol: c.symbol?.toUpperCase(),
      name: c.name,
      price: c.current_price,
      marketCap: c.market_cap,
      volume24h: c.total_volume,
      change24h: c.price_change_percentage_24h,
      change30d: c.price_change_percentage_30d_in_currency,
      image: c.image,
      rank: c.market_cap_rank,
    })),
    source: 'live',
    disclaimer: 'Data CoinGecko publik. Harga sangat volatile — bukan saran beli/jual.',
  }
}

export async function getCoinDetail(id) {
  const slug = String(id || '').toLowerCase().trim()
  if (!slug) return { error: 'id required' }
  const data = await cgFetch(
    `/coins/${slug}?localization=false&tickers=false&community_data=false&developer_data=false&sparkline=false`,
  )
  if (data.error) return data
  const market = data.market_data || {}
  return {
    id: data.id,
    symbol: data.symbol?.toUpperCase(),
    name: data.name,
    image: data.image?.large,
    description: data.description?.id || data.description?.en || '',
    homepage: data.links?.homepage?.filter(Boolean) || [],
    categories: data.categories,
    genesisDate: data.genesis_date,
    marketCapRank: data.market_cap_rank,
    price: market.current_price?.usd,
    marketCap: market.market_cap?.usd,
    volume24h: market.total_volume?.usd,
    change24h: market.price_change_percentage_24h,
    change7d: market.price_change_percentage_7d,
    change30d: market.price_change_percentage_30d,
    ath: market.ath?.usd,
    atl: market.atl?.usd,
  }
}

function ageInDays(genesisDate) {
  if (!genesisDate) return 99999
  const t = new Date(genesisDate).getTime()
  if (!Number.isFinite(t)) return 99999
  return Math.max(0, Math.floor((Date.now() - t) / 86_400_000))
}

export function scoreCoinRisk(coin) {
  if (!coin || coin.error) return { score: null, error: coin?.error || 'no coin' }
  let score = 0
  const reasons = []

  const days = ageInDays(coin.genesisDate)
  if (days < 90) {
    score += 35
    reasons.push(`Sangat baru (${days} hari sejak genesis)`)
  } else if (days < 365) {
    score += 20
    reasons.push(`Cukup baru (${Math.round(days / 30)} bulan sejak genesis)`)
  }

  const mc = coin.marketCap || 0
  if (mc < 1_000_000) {
    score += 25
    reasons.push('Market cap di bawah $1 juta — likuiditas sangat rendah')
  } else if (mc < 10_000_000) {
    score += 12
    reasons.push('Market cap di bawah $10 juta — likuiditas rendah')
  }

  const vol = coin.volume24h || 0
  if (vol < 50_000) {
    score += 15
    reasons.push('Volume 24 jam sangat rendah — sulit jual saat butuh')
  }

  if (!coin.homepage?.length || !coin.homepage[0]) {
    score += 10
    reasons.push('Tidak punya homepage publik')
  }

  if (SCAM_LIST.has(coin.id) || SCAM_LIST.has(coin.symbol?.toLowerCase?.())) {
    score += 30
    reasons.push('Tercantum di daftar koin yang pernah scam/rug-pull')
  }

  if (Number.isFinite(coin.change30d)) {
    if (coin.change30d > 500) {
      score += 12
      reasons.push(`Pump 30 hari +${Math.round(coin.change30d)}% — waspada pump & dump`)
    } else if (coin.change30d < -90) {
      score += 12
      reasons.push(`Dump 30 hari ${Math.round(coin.change30d)}% — tanda token mati`)
    }
  }

  score = Math.max(0, Math.min(100, score))
  const level =
    score >= 70 ? 'sangat_tinggi' :
    score >= 50 ? 'tinggi' :
    score >= 30 ? 'menengah' :
    score >= 15 ? 'rendah' : 'sangat_rendah'

  return {
    score,
    level,
    reasons: reasons.length ? reasons : ['Tidak ada red flag mayor yang terdeteksi.'],
    disclaimer:
      'Skor risiko heuristik berdasarkan data publik — bukan audit smart contract. ' +
      'Crypto tetap berisiko tinggi. DYOR.',
  }
}

export async function assessCryptoRisk(id) {
  const coin = await getCoinDetail(id)
  if (coin.error) return coin
  return { coin, risk: scoreCoinRisk(coin) }
}

/** Full CoinGecko search (works for meme coins, low caps, anything indexed). */
export async function searchCoins(query) {
  const q = String(query || '').trim()
  if (!q) return { error: 'query required', results: [] }
  const data = await cgFetch(`/search?query=${encodeURIComponent(q)}`)
  if (data.error) return { error: data.error, results: [] }
  const coins = (data.coins || []).slice(0, 30).map(c => ({
    id: c.id,
    symbol: (c.symbol || '').toUpperCase(),
    name: c.name,
    marketCapRank: c.market_cap_rank,
    image: c.thumb || c.large,
  }))
  return { query: q, results: coins }
}

/** Price history for a coin — used by TradingChart. */
export async function getCoinHistory(id, days = 90) {
  const data = await cgFetch(`/coins/${encodeURIComponent(String(id).toLowerCase())}/market_chart?vs_currency=usd&days=${days}`)
  if (data.error) return { error: data.error, prices: [] }
  return {
    id,
    days,
    prices: data.prices || [],
    market_caps: data.market_caps || [],
    total_volumes: data.total_volumes || [],
  }
}
