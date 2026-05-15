/**
 * Mirror of server/tools/health.js — runs in the browser for instant
 * feedback while the user adjusts inputs. Server endpoint is the
 * source of truth (and used by the AI agent).
 */

export type HealthInput = {
  monthlyIncome: number
  monthlyExpense: number
  emergencyFund: number
  totalDebt: number
  monthlySavings: number
}

export type Pillar = {
  score: number
  verdict: string
  tip: string
  ratio?: number | null
  monthsCovered?: number | null
  dti?: number | null
  rate?: number | null
}

export type HealthResult = {
  score: number
  overall: 'Prima' | 'Sehat' | 'Cukup' | 'Perlu Perhatian' | 'Kritis'
  tone: 'forest' | 'mint' | 'cream' | 'amber' | 'red'
  pillars: {
    budget: Pillar
    emergencyFund: Pillar
    debt: Pillar
    savings: Pillar
  }
  recommendations: string[]
  disclaimer: string
}

function clamp(n: number, min: number, max: number) {
  if (!Number.isFinite(n)) return min
  return Math.max(min, Math.min(max, n))
}

function pillarBudget(income: number, expense: number): Pillar {
  if (income <= 0) return { score: 0, verdict: 'tidak_diketahui', tip: 'Catat penghasilan dahulu.' }
  const ratio = expense / income
  let score = ratio <= 0.5 ? 25 : 25 - (ratio - 0.5) * 50
  score = clamp(score, 0, 25)
  const verdict =
    ratio <= 0.5 ? 'Sangat sehat' :
    ratio <= 0.7 ? 'Sehat' :
    ratio <= 0.9 ? 'Pas-pasan' :
    ratio <= 1.0 ? 'Impas' : 'Defisit'
  const tip =
    verdict === 'Defisit'
      ? 'Pengeluaran melebihi pemasukan. Audit dan pangkas yang tidak penting.'
      : verdict === 'Impas' || verdict === 'Pas-pasan'
      ? 'Coba rumus 50/30/20 sebagai patokan.'
      : 'Rasio pengeluaran sehat. Sisihkan selisihnya untuk dana darurat atau investasi.'
  return { score: Math.round(score), ratio: Math.round(ratio * 100) / 100, verdict, tip }
}

function pillarEmergency(fund: number, expense: number): Pillar {
  if (expense <= 0) return { score: 0, verdict: 'tidak_diketahui', tip: 'Catat pengeluaran bulanan.' }
  const months = fund / expense
  let score = clamp((months / 6) * 25, 0, 25)
  const verdict =
    months >= 6 ? 'Sangat aman' :
    months >= 3 ? 'Aman' :
    months >= 1 ? 'Rentan' : 'Sangat rentan'
  const tip =
    verdict === 'Sangat aman'
      ? `Cukup untuk ${months.toFixed(1)} bulan — lanjut ke tabungan jangka panjang.`
      : verdict === 'Aman'
      ? `Sudah ${months.toFixed(1)} bulan. Target idealnya 6 bulan.`
      : verdict === 'Rentan'
      ? `Baru ${months.toFixed(1)} bulan. Prioritaskan menambah sebelum investasi.`
      : 'Hampir kosong. Buka rekening terpisah, auto-debit 10% dari penghasilan.'
  return { score: Math.round(score), monthsCovered: Math.round(months * 10) / 10, verdict, tip }
}

function pillarDebt(debt: number, income: number): Pillar {
  if (income <= 0) return { score: 0, verdict: 'tidak_diketahui', tip: 'Catat penghasilan dahulu.' }
  const dti = debt / (income * 12)
  const score = clamp(25 - dti * 25, 0, 25)
  const verdict =
    dti <= 0.2 ? 'Rendah' :
    dti <= 0.36 ? 'Sehat' :
    dti <= 0.6 ? 'Tinggi' : 'Sangat tinggi'
  const tip =
    verdict === 'Rendah'
      ? 'Beban hutang ringan. Tetap waspada pinjol.'
      : verdict === 'Sehat'
      ? 'Hutang dalam batas wajar (≤36% pendapatan tahunan).'
      : verdict === 'Tinggi'
      ? 'Beban tinggi. Lunasi yang bunganya terbesar lebih dulu.'
      : 'Beban sangat tinggi. Hindari pinjaman baru. Konsultasi LBH (021) 390-4226.'
  return { score: Math.round(score), dti: Math.round(dti * 100) / 100, verdict, tip }
}

function pillarSavings(savings: number, income: number): Pillar {
  if (income <= 0) return { score: 0, verdict: 'tidak_diketahui', tip: 'Catat penghasilan dahulu.' }
  const rate = savings / income
  const score = clamp((rate / 0.2) * 25, 0, 25)
  const verdict =
    rate >= 0.3 ? 'Luar biasa' :
    rate >= 0.2 ? 'Ideal' :
    rate >= 0.1 ? 'Cukup' :
    rate > 0 ? 'Minim' : 'Belum menabung'
  const tip =
    verdict === 'Luar biasa'
      ? 'Pertimbangkan diversifikasi (reksadana, saham) sesuai profil risiko.'
      : verdict === 'Ideal'
      ? 'Sudah mencapai 20%. Pertahankan.'
      : verdict === 'Cukup'
      ? 'Target 20% lebih ideal. Naikkan otomatis 1% setiap 3 bulan.'
      : verdict === 'Minim'
      ? 'Mulai kecil dan otomatis. Konsistensi mengalahkan jumlah.'
      : 'Buka rekening terpisah dan otomatiskan Rp 100.000/bulan di payday.'
  return { score: Math.round(score), rate: Math.round(rate * 100) / 100, verdict, tip }
}

function overallLabel(score: number) {
  if (score >= 85) return { label: 'Prima', tone: 'forest' } as const
  if (score >= 70) return { label: 'Sehat', tone: 'mint' } as const
  if (score >= 50) return { label: 'Cukup', tone: 'cream' } as const
  if (score >= 30) return { label: 'Perlu Perhatian', tone: 'amber' } as const
  return { label: 'Kritis', tone: 'red' } as const
}

export function scoreFinancialHealth(input: HealthInput): HealthResult {
  const { monthlyIncome, monthlyExpense, emergencyFund, totalDebt, monthlySavings } = input
  const budget = pillarBudget(monthlyIncome, monthlyExpense)
  const fund = pillarEmergency(emergencyFund, monthlyExpense)
  const debt = pillarDebt(totalDebt, monthlyIncome)
  const savings = pillarSavings(monthlySavings, monthlyIncome)

  const total = budget.score + fund.score + debt.score + savings.score
  const overall = overallLabel(total)

  const recommendations: string[] = []
  if (budget.verdict === 'Defisit' || budget.verdict === 'Impas') {
    recommendations.push('Audit pengeluaran bulan ini — target turunkan minimal 10%.')
  }
  if (fund.verdict === 'Sangat rentan' || fund.verdict === 'Rentan') {
    recommendations.push('Bangun dana darurat di rekening terpisah, minimal 3× pengeluaran bulanan.')
  }
  if (debt.verdict === 'Tinggi' || debt.verdict === 'Sangat tinggi') {
    recommendations.push('Susun rencana pelunasan hutang — fokus ke yang bunganya tertinggi.')
  }
  if (savings.verdict === 'Belum menabung' || savings.verdict === 'Minim') {
    recommendations.push('Otomasikan tabungan minimal 10% dari penghasilan tiap payday.')
  }
  if (!recommendations.length) {
    recommendations.push('Pertahankan ritme. Pertimbangkan diversifikasi di halaman Rencana.')
  }

  return {
    score: total,
    overall: overall.label,
    tone: overall.tone,
    pillars: { budget, emergencyFund: fund, debt, savings },
    recommendations,
    disclaimer: 'Skor edukasi berdasarkan rasio umum keuangan pribadi. Bukan saran finansial berlisensi.',
  }
}
