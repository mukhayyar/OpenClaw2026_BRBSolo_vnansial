/**
 * Cek Kesehatan Finansial — score a user's financial health from 0–100.
 *
 * Four pillars (25 points each):
 *  1. Anggaran (budget)         — pengeluaran ≤ 80% pemasukan?
 *  2. Cadangan (emergency fund) — fund / monthlyExpenses, target 6 bulan
 *  3. Hutang (debt)             — total debt / yearly income, target ≤ 36%
 *  4. Tabungan (savings)        — savingsRate = saving / income, target ≥ 20%
 *
 * The math is deliberately conservative — designed to be a *trigger* for
 * education, not a verdict. Always emit advice + disclaimer.
 */

function clamp(n, min, max) {
  if (!Number.isFinite(n)) return min
  return Math.max(min, Math.min(max, n))
}

function pillarBudget({ monthlyIncome, monthlyExpense }) {
  if (!monthlyIncome || monthlyIncome <= 0) {
    return { score: 0, ratio: null, verdict: 'tidak_diketahui', tip: 'Catat penghasilan bulanan terlebih dahulu.' }
  }
  const ratio = monthlyExpense / monthlyIncome
  // 0.5 (great) → 25; 0.8 (ok) → 18; 1.0 (impas) → 8; >1.2 (defisit) → 0
  let score = 25
  if (ratio > 0.5) score = 25 - (ratio - 0.5) * 50
  score = clamp(score, 0, 25)
  const verdict =
    ratio <= 0.5 ? 'sangat_sehat' :
    ratio <= 0.7 ? 'sehat' :
    ratio <= 0.9 ? 'pas_pasan' :
    ratio <= 1.0 ? 'impas' : 'defisit'
  const tip =
    verdict === 'defisit'
      ? 'Pengeluaran melebihi pemasukan. Audit pengeluaran tetap dan variabel — pangkas yang tidak penting.'
      : verdict === 'impas' || verdict === 'pas_pasan'
      ? 'Pengeluaranmu mendekati pemasukan. Coba rumus 50/30/20 sebagai patokan.'
      : 'Rasio pengeluaran sehat. Sisihkan selisihnya untuk dana darurat atau investasi.'
  return { score: Math.round(score), ratio: Math.round(ratio * 100) / 100, verdict, tip }
}

function pillarEmergencyFund({ emergencyFund, monthlyExpense }) {
  if (!monthlyExpense || monthlyExpense <= 0) {
    return { score: 0, monthsCovered: null, verdict: 'tidak_diketahui', tip: 'Catat pengeluaran bulanan terlebih dahulu.' }
  }
  const months = (emergencyFund || 0) / monthlyExpense
  // 0 bln → 0; 3 bln → 15; 6 bln → 25 (cap)
  let score = (months / 6) * 25
  score = clamp(score, 0, 25)
  const verdict =
    months >= 6 ? 'sangat_aman' :
    months >= 3 ? 'aman' :
    months >= 1 ? 'rentan' : 'sangat_rentan'
  const tip =
    verdict === 'sangat_aman'
      ? `Dana daruratmu cukup untuk ${months.toFixed(1)} bulan — lanjut fokus ke tabungan jangka panjang.`
      : verdict === 'aman'
      ? `Sudah cukup untuk ${months.toFixed(1)} bulan. Target idealnya 6 bulan pengeluaran.`
      : verdict === 'rentan'
      ? `Baru ${months.toFixed(1)} bulan. Prioritaskan menambah dana darurat sebelum investasi.`
      : 'Dana darurat hampir kosong. Buka rekening terpisah dan auto-debit minimal 10% dari penghasilan.'
  return { score: Math.round(score), monthsCovered: Math.round(months * 10) / 10, verdict, tip }
}

function pillarDebt({ totalDebt, monthlyIncome }) {
  if (!monthlyIncome || monthlyIncome <= 0) {
    return { score: 0, dti: null, verdict: 'tidak_diketahui', tip: 'Catat penghasilan bulanan terlebih dahulu.' }
  }
  const annualIncome = monthlyIncome * 12
  const dti = (totalDebt || 0) / annualIncome
  // dti 0 → 25; 0.36 → 18; 0.6 → 9; 1.0+ → 0
  let score = 25 - dti * 25
  score = clamp(score, 0, 25)
  const verdict =
    dti <= 0.2 ? 'rendah' :
    dti <= 0.36 ? 'sehat' :
    dti <= 0.6 ? 'tinggi' : 'sangat_tinggi'
  const tip =
    verdict === 'rendah'
      ? 'Beban hutang ringan. Tetap waspada terhadap pinjol/kartu kredit.'
      : verdict === 'sehat'
      ? 'Hutang masih dalam batas wajar (≤36% penghasilan tahunan).'
      : verdict === 'tinggi'
      ? 'Beban hutang tinggi. Prioritaskan melunasi yang bunganya paling besar (snowball atau avalanche method).'
      : 'Beban hutang sangat tinggi. Hindari pinjaman baru. Pertimbangkan konsultasi LBH (021) 390-4226.'
  return { score: Math.round(score), dti: Math.round(dti * 100) / 100, verdict, tip }
}

function pillarSavings({ monthlySavings, monthlyIncome }) {
  if (!monthlyIncome || monthlyIncome <= 0) {
    return { score: 0, rate: null, verdict: 'tidak_diketahui', tip: 'Catat penghasilan bulanan terlebih dahulu.' }
  }
  const rate = (monthlySavings || 0) / monthlyIncome
  // 0 → 0; 0.2 → 25 (cap)
  let score = (rate / 0.2) * 25
  score = clamp(score, 0, 25)
  const verdict =
    rate >= 0.3 ? 'luar_biasa' :
    rate >= 0.2 ? 'ideal' :
    rate >= 0.1 ? 'cukup' :
    rate > 0 ? 'minim' : 'belum_menabung'
  const tip =
    verdict === 'luar_biasa'
      ? 'Tingkat tabunganmu di atas rata-rata. Pertimbangkan diversifikasi (reksadana, saham) sesuai profil risiko.'
      : verdict === 'ideal'
      ? 'Sudah mencapai target 20%. Pertahankan ritme ini.'
      : verdict === 'cukup'
      ? 'Sudah menabung, tapi target 20% lebih ideal. Coba naikkan otomatis 1% setiap 3 bulan.'
      : verdict === 'minim'
      ? 'Mulai dari nominal kecil dan otomatis. Konsistensi mengalahkan jumlah.'
      : 'Buka rekening terpisah untuk tabungan. Mulai dari Rp 100.000 per bulan otomatis di payday.'
  return { score: Math.round(score), rate: Math.round(rate * 100) / 100, verdict, tip }
}

function overallLabel(score) {
  if (score >= 85) return { label: 'Prima', tone: 'forest' }
  if (score >= 70) return { label: 'Sehat', tone: 'mint' }
  if (score >= 50) return { label: 'Cukup', tone: 'cream' }
  if (score >= 30) return { label: 'Perlu Perhatian', tone: 'amber' }
  return { label: 'Kritis', tone: 'red' }
}

export function scoreFinancialHealth(input = {}) {
  const monthlyIncome = Number(input.monthlyIncome) || 0
  const monthlyExpense = Number(input.monthlyExpense) || 0
  const emergencyFund = Number(input.emergencyFund) || 0
  const totalDebt = Number(input.totalDebt) || 0
  const monthlySavings = Number(input.monthlySavings) || 0

  if (monthlyIncome <= 0 && monthlyExpense <= 0) {
    return {
      error:
        'Minimal isi penghasilan dan pengeluaran bulanan untuk menghitung skor.',
    }
  }

  const budget = pillarBudget({ monthlyIncome, monthlyExpense })
  const fund = pillarEmergencyFund({ emergencyFund, monthlyExpense })
  const debt = pillarDebt({ totalDebt, monthlyIncome })
  const savings = pillarSavings({ monthlySavings, monthlyIncome })

  const total = budget.score + fund.score + debt.score + savings.score
  const overall = overallLabel(total)

  const recommendations = []
  if (budget.verdict === 'defisit' || budget.verdict === 'impas') {
    recommendations.push('Audit pengeluaran besar bulan ini — target turunkan minimal 10%.')
  }
  if (fund.verdict === 'sangat_rentan' || fund.verdict === 'rentan') {
    recommendations.push('Bangun dana darurat di rekening terpisah, minimal 3× pengeluaran bulanan.')
  }
  if (debt.verdict === 'tinggi' || debt.verdict === 'sangat_tinggi') {
    recommendations.push('Susun rencana pelunasan hutang — fokus ke yang bunganya paling tinggi.')
  }
  if (savings.verdict === 'belum_menabung' || savings.verdict === 'minim') {
    recommendations.push('Otomasikan tabungan minimal 10% dari penghasilan setiap payday.')
  }
  if (!recommendations.length) {
    recommendations.push('Pertahankan ritme. Pertimbangkan diversifikasi investasi sesuai profil risiko di /rencana-investasi.')
  }

  return {
    score: total,
    overall: overall.label,
    tone: overall.tone,
    pillars: { budget, emergencyFund: fund, debt, savings },
    recommendations,
    inputs: {
      monthlyIncome,
      monthlyExpense,
      emergencyFund,
      totalDebt,
      monthlySavings,
    },
    disclaimer:
      'Skor edukasi berdasarkan rasio umum keuangan pribadi. Bukan saran finansial berlisensi.',
  }
}
