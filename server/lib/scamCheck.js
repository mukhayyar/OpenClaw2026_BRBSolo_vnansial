/**
 * Scam-check tools — query Indonesian public scam-reporting databases.
 *
 * Sources:
 *  - cekrekening.id (Kementerian Kominfo) — bank account reports
 *  - aduannomor.id  (Kementerian Kominfo / BRTI) — cellular number reports
 *
 * Both sites are HTML pages today. We attempt their public POST/GET
 * endpoints first; if upstream changes shape we still return a usable
 * payload that includes the deep-link URL the user (or AI) can show.
 */

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  Accept: 'application/json,text/html,*/*',
  'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
}

const CACHE_TTL_MS = 30 * 60 * 1000
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

const KNOWN_BANKS = {
  BCA: 'Bank Central Asia',
  BRI: 'Bank Rakyat Indonesia',
  BNI: 'Bank Negara Indonesia',
  MANDIRI: 'Bank Mandiri',
  CIMB: 'CIMB Niaga',
  BSI: 'Bank Syariah Indonesia',
  PERMATA: 'Bank Permata',
  DANAMON: 'Bank Danamon',
  MEGA: 'Bank Mega',
  BTN: 'Bank Tabungan Negara',
}

function normalizeBank(code) {
  return String(code || '').trim().toUpperCase().replace(/\s+/g, '_')
}

function normalizeNumber(num) {
  return String(num || '').replace(/\D/g, '')
}

function normalizePhone(num) {
  let p = String(num || '').replace(/[^\d+]/g, '')
  if (p.startsWith('0')) p = '62' + p.slice(1)
  if (p.startsWith('+')) p = p.slice(1)
  return p
}

/**
 * Check a bank account against cekrekening.id.
 *
 * Strategy:
 *  1. Try the public check endpoint (POST JSON to /api/checking-account).
 *  2. If upstream rejects, return a structured "unknown" answer with the
 *     manual-check URL so the user (or agent) can render a "buka cekrekening.id"
 *     button.
 */
export async function checkBankAccount({ accountNumber, bankCode }) {
  const acct = normalizeNumber(accountNumber)
  const bank = normalizeBank(bankCode || 'BCA')
  if (!acct || acct.length < 6) {
    return { error: 'Nomor rekening tidak valid (minimal 6 digit angka).' }
  }
  const ck = `rek:${bank}:${acct}`
  const cached = getCache(ck)
  if (cached) return { ...cached, cached: true }

  const manualUrl = `https://cekrekening.id/cek-rekening?account_number=${acct}&bank_code=${bank}`
  const out = {
    source: 'cekrekening.id',
    accountNumber: acct,
    bankCode: bank,
    bankName: KNOWN_BANKS[bank] || bank,
    manualUrl,
    found: null,
    reports: [],
    advice: '',
    disclaimer:
      'Data dari cekrekening.id (Kominfo). Tidak adanya laporan di database BUKAN jaminan bahwa rekening aman — selalu verifikasi mandiri.',
  }

  try {
    const res = await fetch('https://cekrekening.id/api/checking-account', {
      method: 'POST',
      headers: { ...HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ account_number: acct, bank_code: bank }),
    })
    if (res.ok) {
      const data = await res.json().catch(() => null)
      if (data && (Array.isArray(data.data) || data.data)) {
        const reports = Array.isArray(data.data) ? data.data : [data.data]
        out.found = reports.length > 0
        out.reports = reports.map(r => ({
          category: r.reported_status || r.category || r.kategori || 'tidak diketahui',
          reportCount: r.report_count || r.jumlah_laporan || reports.length,
          lastReported: r.last_reported || r.tanggal || null,
        }))
        out.advice = out.found
          ? `Rekening ini sudah dilaporkan ${out.reports.length} kali di database cekrekening.id. JANGAN transfer. Jika sudah, segera hubungi bank & lapor ke 157.`
          : 'Belum ada laporan publik di cekrekening.id. Tetap waspada — lakukan verifikasi lain.'
      }
    } else {
      out.advice = `Layanan cekrekening.id memberi status ${res.status}. Coba akses manual lewat URL di atas.`
    }
  } catch (err) {
    out.error = err.message
    out.advice = 'Tidak bisa menghubungi cekrekening.id. Buka URL manual untuk cek langsung.'
  }

  setCache(ck, out)
  return out
}

/**
 * Check a phone number against aduannomor.id.
 *
 * Same strategy: try POST endpoint, fall back to manual URL.
 */
export async function checkPhoneNumber({ phone }) {
  const p = normalizePhone(phone)
  if (!p || p.length < 8) {
    return { error: 'Nomor HP tidak valid (minimal 8 digit setelah kode negara).' }
  }
  const ck = `hp:${p}`
  const cached = getCache(ck)
  if (cached) return { ...cached, cached: true }

  const manualUrl = `https://aduannomor.id/cek-nomor-seluler?q=${p}`
  const out = {
    source: 'aduannomor.id',
    phone: p,
    manualUrl,
    found: null,
    reports: [],
    advice: '',
    disclaimer:
      'Data dari aduannomor.id (Kominfo/BRTI). Tidak adanya laporan BUKAN jaminan nomor aman — selalu lakukan verifikasi mandiri.',
  }

  try {
    const res = await fetch(`https://aduannomor.id/api/checking-number?number=${encodeURIComponent(p)}`, {
      headers: HEADERS,
    })
    if (res.ok) {
      const data = await res.json().catch(() => null)
      if (data && (Array.isArray(data.data) || data.data)) {
        const reports = Array.isArray(data.data) ? data.data : [data.data]
        out.found = reports.length > 0
        out.reports = reports.map(r => ({
          category: r.kategori || r.category || 'tidak diketahui',
          reportCount: r.jumlah_laporan || r.report_count || reports.length,
          lastReported: r.tanggal || r.last_reported || null,
        }))
        out.advice = out.found
          ? `Nomor ini sudah dilaporkan ${out.reports.length} kali di aduannomor.id. Blokir, jangan respon, dan jangan share data pribadi.`
          : 'Belum ada laporan publik. Tetap waspada terhadap pesan yang menjanjikan hadiah, mengaku petugas bank/OJK, atau minta OTP.'
      }
    } else {
      out.advice = `Layanan aduannomor.id memberi status ${res.status}. Coba akses manual lewat URL di atas.`
    }
  } catch (err) {
    out.error = err.message
    out.advice = 'Tidak bisa menghubungi aduannomor.id. Buka URL manual untuk cek langsung.'
  }

  setCache(ck, out)
  return out
}
