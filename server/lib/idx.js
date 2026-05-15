/**
 * IDX.co.id proxy.
 *
 * Why a proxy: idx.co.id requires Referer/User-Agent headers — direct
 * browser fetch returns 403. We forward server-side with the right headers
 * and short-cache the JSON.
 *
 * All endpoints accept `KodeEmiten` (4-letter ticker, e.g. BBCA, AADI).
 */

const BASE = 'https://www.idx.co.id'
const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  Referer: 'https://www.idx.co.id/id/perusahaan-tercatat/profil-perusahaan-tercatat/',
  Origin: 'https://www.idx.co.id',
  Accept: 'application/json, text/plain, */*',
  'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
  'Accept-Encoding': 'gzip, deflate, br',
  'Sec-Fetch-Site': 'same-origin',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Dest': 'empty',
  'X-Requested-With': 'XMLHttpRequest',
}

// idx.co.id sometimes gates with a cookie challenge. We do a one-shot
// "warm-up" GET to the homepage at startup and reuse Set-Cookie headers.
let cookieJar = ''
let cookiePromise = null

async function warmCookies() {
  if (cookiePromise) return cookiePromise
  cookiePromise = (async () => {
    try {
      const res = await fetch(BASE, {
        headers: { 'User-Agent': HEADERS['User-Agent'], Accept: 'text/html' },
      })
      const cookies = res.headers.getSetCookie?.() || []
      cookieJar = cookies.map(c => c.split(';')[0]).filter(Boolean).join('; ')
    } catch {
      // ignore — proxy will still try, just without cookies
    }
  })()
  return cookiePromise
}

const CACHE_TTL_MS = 10 * 60 * 1000 // 10 min — IDX data changes slowly
const cache = new Map()

function getCache(key) {
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

async function idxFetch(path) {
  const ck = `idx:${path}`
  const hit = getCache(ck)
  if (hit) return { ...hit, cached: true }

  await warmCookies()
  const headers = { ...HEADERS }
  if (cookieJar) headers.Cookie = cookieJar

  try {
    const res = await fetch(`${BASE}${path}`, { headers })
    if (res.status === 403 || res.status === 401) {
      // Try once more after re-priming cookies
      cookiePromise = null
      cookieJar = ''
      await warmCookies()
      if (cookieJar) headers.Cookie = cookieJar
      const retry = await fetch(`${BASE}${path}`, { headers })
      if (!retry.ok) {
        return {
          error: `IDX ${retry.status}`,
          status: retry.status,
          hint: 'idx.co.id may be rate-limiting this server. Cek 10 menit lagi.',
        }
      }
      const data = await retry.json()
      setCache(ck, data)
      return { ...data, cached: false }
    }
    if (!res.ok) {
      return { error: `IDX ${res.status}`, status: res.status }
    }
    const data = await res.json()
    setCache(ck, data)
    return { ...data, cached: false }
  } catch (err) {
    return { error: err.message || 'IDX request failed' }
  }
}

function normCode(code) {
  return String(code || '').trim().toUpperCase().replace(/\s+/g, '')
}

export async function getCompanyProfile(code) {
  const c = normCode(code)
  if (!c) return { error: 'KodeEmiten required' }
  return idxFetch(
    `/primary/ListedCompany/GetCompanyProfilesDetail?KodeEmiten=${c}&language=id-id`,
  )
}

export async function getIssuedHistory(code) {
  const c = normCode(code)
  return idxFetch(
    `/primary/ListingActivity/GetIssuedHistory?kodeEmiten=${c}&start=0&length=9999`,
  )
}

export async function getProfileAnnouncement(code, opts = {}) {
  const c = normCode(code)
  const today = new Date()
  const y = today.getUTCFullYear()
  const m = String(today.getUTCMonth() + 1).padStart(2, '0')
  const d = String(today.getUTCDate()).padStart(2, '0')
  const ago = new Date(today.getTime() - 365 * 86400_000)
  const ay = ago.getUTCFullYear()
  const am = String(ago.getUTCMonth() + 1).padStart(2, '0')
  const ad = String(ago.getUTCDate()).padStart(2, '0')
  const dateFrom = opts.dateFrom || `${ay}${am}${ad}`
  const dateTo = opts.dateTo || `${y}${m}${d}`
  return idxFetch(
    `/primary/ListedCompany/GetProfileAnnouncement?KodeEmiten=${c}&indexFrom=0&pageSize=10&dateFrom=${dateFrom}&dateTo=${dateTo}&lang=id&keyword=`,
  )
}

export async function getCalendar(code, date) {
  const c = normCode(code)
  const d =
    date ||
    (() => {
      const t = new Date()
      return `${t.getUTCFullYear()}${String(t.getUTCMonth() + 1).padStart(2, '0')}${String(t.getUTCDate()).padStart(2, '0')}`
    })()
  return idxFetch(`/primary/Home/GetCalendar?range=${c}&date=${d}`)
}

export async function getFinancialReport(code, periode = 'audit', year = new Date().getUTCFullYear()) {
  const c = normCode(code)
  return idxFetch(
    `/primary/ListedCompany/GetFinancialReport?periode=${periode}&year=${year}&indexFrom=0&pageSize=1000&reportType=rdf&kodeEmiten=${c}`,
  )
}

export async function getDividenTunai(code, year = new Date().getUTCFullYear()) {
  const c = normCode(code)
  return idxFetch(`/primary/ListedCompany/GetDividenTunai?KodeEmiten=${c}&Year=${year}`)
}

export async function getDividenSaham(code, year = new Date().getUTCFullYear()) {
  const c = normCode(code)
  return idxFetch(`/primary/ListedCompany/GetDividenSaham?KodeEmiten=${c}&Year=${year}`)
}

export async function getPerubahanNama(code, year = new Date().getUTCFullYear()) {
  const c = normCode(code)
  return idxFetch(`/primary/ListedCompany/GetPerubahanNamaHistory?KodeEmiten=${c}&Year=${year}`)
}

export async function getCoreBusinessHistory(code, year = new Date().getUTCFullYear()) {
  const c = normCode(code)
  return idxFetch(`/primary/ListedCompany/GetCoreBusinessHistory?KodeEmiten=${c}&Year=${year}`)
}

export async function getESG(code, year = new Date().getUTCFullYear()) {
  const c = normCode(code)
  return idxFetch(`/secondary/get/ListedCompanies/ESG/Information?KodeEmiten=${c}&Year=${year}`)
}

export async function getPemegangSaham(code, year = new Date().getUTCFullYear()) {
  const c = normCode(code)
  return idxFetch(`/primary/ListedCompany/GetPemegangSahamHistory?KodeEmiten=${c}&Year=${year}`)
}

export async function getPemegangSahamPengendali(code, year = new Date().getUTCFullYear()) {
  const c = normCode(code)
  return idxFetch(`/primary/ListedCompany/GetPemegangSahamPengendaliHistory?KodeEmiten=${c}&Year=${year}`)
}

/** Composite — single round-trip for a company overview. */
export async function getCompanyOverview(code) {
  const c = normCode(code)
  if (!c) return { error: 'KodeEmiten required' }
  const [profile, dividenTunai, dividenSaham, esg, pemegang, announcement] = await Promise.all([
    getCompanyProfile(c),
    getDividenTunai(c),
    getDividenSaham(c),
    getESG(c),
    getPemegangSaham(c),
    getProfileAnnouncement(c),
  ])
  return {
    code: c,
    profile,
    dividenTunai,
    dividenSaham,
    esg,
    pemegang,
    announcement,
    disclaimer: 'Data IDX di-proxy untuk edukasi. Verifikasi resmi di idx.co.id.',
  }
}

/**
 * Cached list of common IDX emiten codes — used as a search fallback when
 * the upstream listing endpoint changes shape. Production should call IDX
 * `/primary/ListedCompany/GetCompanies` (lazy-loaded below).
 */
let allEmitenCache = null
let allEmitenAt = 0

export async function listAllEmiten() {
  const now = Date.now()
  if (allEmitenCache && now - allEmitenAt < 6 * 60 * 60 * 1000) {
    return { source: 'cache', companies: allEmitenCache }
  }
  try {
    const res = await fetch(
      `${BASE}/primary/ListedCompany/GetCompanies?start=0&length=9999&search=`,
      { headers: HEADERS },
    )
    if (res.ok) {
      const data = await res.json()
      const rows = data?.Replies || data?.data || data?.recordsTotal ? data : null
      if (rows) {
        const list = (data?.Replies || data?.data || []).map(r => ({
          code: r.KodeEmiten || r.Code || r.code,
          name: r.NamaEmiten || r.Name || r.name,
          sector: r.Sektor || r.Sector || r.sector,
        }))
        if (list.length) {
          allEmitenCache = list
          allEmitenAt = now
          return { source: 'idx', companies: list }
        }
      }
    }
  } catch {
    // fall through
  }
  // Fallback: small curated list (covers blue chips + frequently searched)
  return {
    source: 'fallback',
    companies: FALLBACK_EMITEN,
  }
}

export const FALLBACK_EMITEN = [
  { code: 'BBCA', name: 'Bank Central Asia Tbk', sector: 'Keuangan' },
  { code: 'BBRI', name: 'Bank Rakyat Indonesia Tbk', sector: 'Keuangan' },
  { code: 'BMRI', name: 'Bank Mandiri Tbk', sector: 'Keuangan' },
  { code: 'BBNI', name: 'Bank Negara Indonesia Tbk', sector: 'Keuangan' },
  { code: 'TLKM', name: 'Telkom Indonesia Tbk', sector: 'Telekomunikasi' },
  { code: 'ASII', name: 'Astra International Tbk', sector: 'Konsumen' },
  { code: 'UNVR', name: 'Unilever Indonesia Tbk', sector: 'Konsumen' },
  { code: 'GOTO', name: 'GoTo Gojek Tokopedia Tbk', sector: 'Teknologi' },
  { code: 'AADI', name: 'Adaro Andalan Indonesia Tbk', sector: 'Energi' },
  { code: 'ADRO', name: 'Adaro Energy Indonesia Tbk', sector: 'Energi' },
  { code: 'INDF', name: 'Indofood Sukses Makmur Tbk', sector: 'Konsumen' },
  { code: 'ICBP', name: 'Indofood CBP Sukses Makmur Tbk', sector: 'Konsumen' },
  { code: 'KLBF', name: 'Kalbe Farma Tbk', sector: 'Kesehatan' },
  { code: 'MYOR', name: 'Mayora Indah Tbk', sector: 'Konsumen' },
  { code: 'PTBA', name: 'Bukit Asam Tbk', sector: 'Energi' },
  { code: 'ANTM', name: 'Aneka Tambang Tbk', sector: 'Tambang' },
  { code: 'INCO', name: 'Vale Indonesia Tbk', sector: 'Tambang' },
  { code: 'SMGR', name: 'Semen Indonesia Tbk', sector: 'Industri' },
  { code: 'INTP', name: 'Indocement Tunggal Prakarsa Tbk', sector: 'Industri' },
  { code: 'JSMR', name: 'Jasa Marga Tbk', sector: 'Infrastruktur' },
  { code: 'WIKA', name: 'Wijaya Karya Tbk', sector: 'Infrastruktur' },
  { code: 'PGAS', name: 'Perusahaan Gas Negara Tbk', sector: 'Energi' },
  { code: 'EXCL', name: 'XL Axiata Tbk', sector: 'Telekomunikasi' },
  { code: 'ISAT', name: 'Indosat Tbk', sector: 'Telekomunikasi' },
  { code: 'MEDC', name: 'Medco Energi Internasional Tbk', sector: 'Energi' },
  { code: 'AMRT', name: 'Sumber Alfaria Trijaya (Alfamart) Tbk', sector: 'Konsumen' },
  { code: 'BREN', name: 'Barito Renewables Energy Tbk', sector: 'Energi' },
  { code: 'TPIA', name: 'Chandra Asri Petrochemical Tbk', sector: 'Industri' },
  { code: 'AMMN', name: 'Amman Mineral Internasional Tbk', sector: 'Tambang' },
  { code: 'BUKA', name: 'Bukalapak.com Tbk', sector: 'Teknologi' },
  { code: 'EMTK', name: 'Elang Mahkota Teknologi Tbk', sector: 'Media' },
  { code: 'MNCN', name: 'Media Nusantara Citra Tbk', sector: 'Media' },
  { code: 'SIDO', name: 'Industri Jamu dan Farmasi Sido Muncul Tbk', sector: 'Kesehatan' },
  { code: 'HMSP', name: 'Hanjaya Mandala Sampoerna Tbk', sector: 'Konsumen' },
  { code: 'GGRM', name: 'Gudang Garam Tbk', sector: 'Konsumen' },
]

export function clearIdxCache() {
  cache.clear()
  allEmitenCache = null
}
