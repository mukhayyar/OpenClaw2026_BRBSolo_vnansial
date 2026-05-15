import { OJK_LICENSED, RED_FLAGS } from '../data/ojk.js'

function calcLoan(principal, annualRate, months) {
  const r = annualRate / 100 / 12
  if (r === 0) return { monthly: principal / months, total: principal, interest: 0 }
  const monthly = principal * (r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1)
  const total = monthly * months
  return { monthly, total, interest: total - principal }
}

function calcFlatLoan(principal, annualRate, months) {
  const interest = principal * (annualRate / 100) * (months / 12)
  const total = principal + interest
  return { monthly: total / months, total, interest }
}

export function checkInvestmentCompany({ companyName }) {
  const q = String(companyName || '').trim().toLowerCase()
  if (!q) return { error: 'Nama perusahaan wajib diisi' }

  const match = OJK_LICENSED.get(q)
  if (match) {
    return {
      found: true,
      company: match,
      advice:
        match.status === 'TERDAFTAR'
          ? 'Entitas terdaftar di database demo OJK. Tetap verifikasi langsung di situs resmi OJK.'
          : 'PERINGATAN: Entitas ini terdaftar sebagai ilegal di database demo. Jangan transfer dana.',
    }
  }
  return {
    found: false,
    company: null,
    advice:
      'Tidak ditemukan di database demo. Waspada — cek langsung di ojk.go.id atau SWI (Satgas Waspada Investasi). Jika ada ≥3 red flag, hindari investasi.',
  }
}

export function calculateLoan({ principal, annualRatePercent, months, method = 'anuitas' }) {
  const p = Number(principal)
  const rate = Number(annualRatePercent)
  const m = Number(months)
  if (!p || p <= 0) return { error: 'Pokok pinjaman harus positif' }
  if (!m || m <= 0) return { error: 'Tenor bulan harus positif' }

  const result =
    method === 'flat' ? calcFlatLoan(p, rate, m) : calcLoan(p, rate, m)
  const effectiveRatePercent = ((result.total / p - 1) * 100)
  const verdict = rate <= 15 ? 'fair' : rate <= 40 ? 'warning' : 'predatory'

  return {
    method,
    principal: p,
    annualRatePercent: rate,
    months: m,
    monthlyPayment: Math.round(result.monthly),
    totalPayment: Math.round(result.total),
    totalInterest: Math.round(result.interest),
    effectiveRatePercent: Math.round(effectiveRatePercent * 10) / 10,
    verdict,
    verdictLabel:
      verdict === 'fair'
        ? 'Relatif wajar — bandingkan dengan bank/OJK'
        : verdict === 'warning'
          ? 'Tinggi — pastikan kamu paham risikonya'
          : 'Predator — sangat berisiko, hindari pinjol ilegal/rentenir',
  }
}

export function assessInvestmentRedFlags({ checkedIndices = [] }) {
  const indices = Array.isArray(checkedIndices) ? checkedIndices : []
  const count = indices.filter(i => Number.isInteger(i) && i >= 0 && i < RED_FLAGS.length).length
  const riskLevel = count === 0 ? null : count <= 2 ? 'low' : count <= 4 ? 'medium' : 'high'
  return {
    checkedCount: count,
    totalFlags: RED_FLAGS.length,
    flags: RED_FLAGS.map((label, i) => ({ index: i, label, checked: indices.includes(i) })),
    riskLevel,
    recommendation:
      riskLevel === 'high'
        ? 'Risiko sangat tinggi. Jangan investasi atau transfer.'
        : riskLevel === 'medium'
          ? 'Waspada. Minta bukti izin OJK dan konsultasi orang tepercaya.'
          : riskLevel === 'low'
            ? 'Beberapa tanda waspada. Teliti lebih lanjut sebelum putuskan.'
            : 'Centang red flag yang kamu lihat pada penawaran investasi.',
  }
}

export function getFraudReportGuide() {
  return {
    steps: [
      { title: 'Kumpulkan Bukti', actions: ['Screenshot chat', 'Bukti transfer', 'Data penipu'] },
      { title: 'Lapor OJK', contacts: ['157', '081-157-157-157', 'konsumen@ojk.go.id'] },
      { title: 'Lapor Polisi', contacts: ['SPKT terdekat', 'patrolisiber.id'] },
      { title: 'Blokir & Laporkan Akun', actions: ['Bank penerima', 'aduankonten.id', 'platform sosmed'] },
    ],
    disclaimer: 'Vnansial bukan penasihat hukum. Ini panduan umum edukasi.',
  }
}
