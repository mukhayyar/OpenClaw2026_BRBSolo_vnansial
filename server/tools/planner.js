const ALLOCATIONS = {
  conservative: {
    label: 'Konservatif',
    mix: { cash: 30, bonds: 40, stocks: 20, alternatives: 10 },
    note: 'Fokus pada stabilitas dan likuiditas. Cocok untuk dana darurat dan horizon pendek.',
  },
  balanced: {
    label: 'Seimbang',
    mix: { cash: 15, bonds: 35, stocks: 40, alternatives: 10 },
    note: 'Keseimbangan pertumbuhan dan risiko. Cocok untuk horizon menengah (3–7 tahun).',
  },
  aggressive: {
    label: 'Agresif',
    mix: { cash: 5, bonds: 15, stocks: 70, alternatives: 10 },
    note: 'Risiko tinggi, volatilitas besar. Hanya jika horizon panjang dan siap rugi sementara.',
  },
}

export function calculateInvestmentGoal({
  targetAmount,
  months,
  monthlyContribution = 0,
  expectedAnnualReturnPercent = 8,
  currentSavings = 0,
}) {
  const target = Number(targetAmount)
  const m = Number(months)
  const pmt = Number(monthlyContribution)
  const rate = Number(expectedAnnualReturnPercent) / 100 / 12
  const pv = Number(currentSavings)

  if (!target || target <= 0) return { error: 'targetAmount harus positif' }
  if (!m || m <= 0) return { error: 'months harus positif' }

  let projected = pv
  for (let i = 0; i < m; i++) {
    projected = projected * (1 + rate) + pmt
  }

  const gap = target - projected
  let requiredMonthly = pmt
  if (gap > 0 && m > 0) {
    if (rate === 0) requiredMonthly = pmt + gap / m
    else {
      const factor = (Math.pow(1 + rate, m) - 1) / rate
      requiredMonthly = pmt + gap / factor
    }
  }

  return {
    targetAmount: Math.round(target),
    months: m,
    monthlyContribution: Math.round(pmt),
    expectedAnnualReturnPercent,
    currentSavings: Math.round(pv),
    projectedEndBalance: Math.round(projected),
    gap: Math.round(gap),
    onTrack: gap <= 0,
    suggestedMonthlyToReachTarget: Math.round(Math.max(requiredMonthly, 0)),
    disclaimer:
      'Simulasi edukasi — bukan prediksi return pasti. Pasar riil bisa rugi. Bukan saran berlisensi OJK.',
  }
}

export function suggestAssetAllocation({ riskProfile = 'balanced' }) {
  const key = String(riskProfile).toLowerCase()
  const profile = ALLOCATIONS[key]
  if (!profile) {
    return {
      error: 'riskProfile harus: conservative, balanced, atau aggressive',
      valid: Object.keys(ALLOCATIONS),
    }
  }
  return {
    riskProfile: key,
    ...profile,
    disclaimer:
      'Alokasi edukasi umum — sesuaikan dengan profil risiko, tujuan, dan konsultasi profesional berlisensi.',
  }
}
