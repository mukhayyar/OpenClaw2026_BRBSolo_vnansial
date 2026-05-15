/**
 * Asuransi Indonesia — data referensi & kalkulator premi.
 *
 * Premi dalam Rupiah per bulan. Angka diambil dari kisaran publik resmi
 * (BPJS Kesehatan 2024) dan estimasi pasar swasta umum. Bukan kuotasi
 * resmi — tujuannya supaya user paham urutan magnitude sebelum bicara
 * dengan agen.
 */

const TYPES = {
  kesehatan: 'Kesehatan',
  jiwa: 'Jiwa',
  kendaraan: 'Kendaraan',
  pendidikan: 'Pendidikan',
  unitlink: 'Unit Link',
}

const COMPANIES = [
  {
    id: 'bpjs-kesehatan',
    name: 'BPJS Kesehatan',
    type: 'kesehatan',
    description: 'Wajib bagi semua WNI. Premi flat per kelas.',
    plans: [
      { name: 'Kelas 1', premiumMonthly: 150000, notes: 'Rawat inap kelas 1' },
      { name: 'Kelas 2', premiumMonthly: 100000, notes: 'Rawat inap kelas 2' },
      { name: 'Kelas 3', premiumMonthly: 42000, notes: 'Subsidi pemerintah Rp 7.000' },
    ],
    pros: ['Wajib, akses puskesmas–RS rujukan', 'Premi paling murah'],
    cons: ['Antrian panjang', 'Tidak semua RS swasta menerima'],
    website: 'https://bpjs-kesehatan.go.id',
  },
  {
    id: 'prudential',
    name: 'Prudential',
    type: 'jiwa',
    description: 'Asuransi jiwa & unit link. Premi tergantung usia & coverage.',
    plans: [
      { name: 'PRUlink Generasi Baru', premiumMonthly: 500000, notes: 'Unit link, mulai Rp 500K' },
      { name: 'PRUSolusi Sehat', premiumMonthly: 350000, notes: 'Cashless di RS rekanan' },
    ],
    pros: ['Jaringan RS rekanan luas', 'Produk variatif'],
    cons: ['Premi unit link sebagian potong investasi', 'Klaim perlu dokumen lengkap'],
    website: 'https://www.prudential.co.id',
  },
  {
    id: 'aia',
    name: 'AIA',
    type: 'jiwa',
    description: 'Asuransi jiwa & kesehatan dari grup AIA Group Limited.',
    plans: [
      { name: 'AIA Optimal Care', premiumMonthly: 400000, notes: 'Kesehatan + jiwa' },
      { name: 'AIA Vitality', premiumMonthly: 250000, notes: 'Diskon premi berdasar gaya hidup sehat' },
    ],
    pros: ['Program reward AIA Vitality', 'Klaim cashless'],
    cons: ['Premi lifetime; bisa naik tiap perpanjang', 'Pre-existing condition exclusion'],
    website: 'https://www.aia-financial.co.id',
  },
  {
    id: 'allianz',
    name: 'Allianz',
    type: 'jiwa',
    description: 'Asuransi terbesar Eropa, kuat di kendaraan & jiwa.',
    plans: [
      { name: 'AlliSya Care', premiumMonthly: 300000, notes: 'Syariah, jiwa + kesehatan' },
      { name: 'Mobil All Risk', premiumMonthly: 250000, notes: 'Premi 2,5% nilai mobil/tahun' },
    ],
    pros: ['Produk syariah tersedia', 'Klaim relatif cepat'],
    cons: ['Premi cenderung lebih mahal', 'Beberapa produk butuh medical check-up'],
    website: 'https://www.allianz.co.id',
  },
  {
    id: 'manulife',
    name: 'Manulife',
    type: 'jiwa',
    description: 'Asuransi & investasi sejak 1985 di Indonesia.',
    plans: [
      { name: 'MiSmart Insurance Solution', premiumMonthly: 450000, notes: 'Jiwa + investasi' },
      { name: 'MiUltimate Critical Care', premiumMonthly: 350000, notes: 'Cover 117 penyakit kritis' },
    ],
    pros: ['Coverage penyakit kritis luas', 'Bisa dikombinasi dengan investasi'],
    cons: ['Lock-in 5+ tahun', 'Biaya akuisisi tinggi di tahun 1–2'],
    website: 'https://www.manulife.co.id',
  },
  {
    id: 'sinarmas',
    name: 'Sinar Mas',
    type: 'kendaraan',
    description: 'Asuransi kendaraan & properti lokal Indonesia.',
    plans: [
      { name: 'Simas Mobil All Risk', premiumMonthly: 200000, notes: '~2,5% nilai mobil/thn' },
      { name: 'Simas Mobil TLO', premiumMonthly: 60000, notes: 'Hanya untuk hilang total' },
    ],
    pros: ['Bengkel rekanan banyak', 'Klaim online via app'],
    cons: ['Banyak deductible', 'Klaim lecet kadang dipersulit'],
    website: 'https://www.sinarmas.co.id',
  },
  {
    id: 'asuransiastra',
    name: 'Asuransi Astra (Garda Oto)',
    type: 'kendaraan',
    description: 'Garda Oto — asuransi mobil paling dikenal Indonesia.',
    plans: [
      { name: 'Garda Oto All Risk', premiumMonthly: 220000, notes: '~2,5–3% nilai mobil/thn' },
      { name: 'Garda Oto TLO', premiumMonthly: 70000, notes: 'Total loss only' },
    ],
    pros: ['Layanan 24 jam Garda Akses', 'Bengkel resmi banyak'],
    cons: ['Premi sedikit di atas rata-rata', 'Reaktivasi polis lama prosedural'],
    website: 'https://www.asuransiastra.com',
  },
  {
    id: 'axa-mandiri',
    name: 'AXA Mandiri',
    type: 'pendidikan',
    description: 'Asuransi pendidikan & jiwa joint Bank Mandiri.',
    plans: [
      { name: 'Mandiri Edukasi', premiumMonthly: 500000, notes: 'Premi 10 thn, manfaat sampai S1' },
      { name: 'MyHospital Care', premiumMonthly: 300000, notes: 'Cashless RS rekanan' },
    ],
    pros: ['Dijual di cabang Mandiri', 'Auto-debit dari rekening'],
    cons: ['Klaim perlu KCU Mandiri', 'Imbal hasil pendidikan modest'],
    website: 'https://axa-mandiri.co.id',
  },
]

export function listInsuranceCompanies(type) {
  if (!type) return { companies: COMPANIES, types: TYPES }
  const filtered = COMPANIES.filter(c => c.type === type)
  return { type, companies: filtered, types: TYPES }
}

export function getInsuranceCompany(id) {
  const c = COMPANIES.find(x => x.id === id)
  if (!c) return { error: `Company ${id} not found` }
  return c
}

/**
 * Premium calculator — very simplified actuarial heuristic for education.
 * coverage in Rupiah (sum insured), age in years.
 *
 * Annual premium ≈ coverage * baseRate * ageMultiplier * healthMultiplier.
 * Per-month = annual / 12.
 */
export function calculatePremium({ type, coverage, age = 30, smoker = false }) {
  const c = Number(coverage) || 0
  const a = Math.max(18, Math.min(75, Number(age) || 30))
  if (c <= 0) return { error: 'coverage required (sum insured)' }
  if (!TYPES[type]) return { error: `type must be one of ${Object.keys(TYPES).join(', ')}` }

  // Per-Rp base rate (sangat disederhanakan)
  const baseRate = {
    kesehatan: 0.0085,
    jiwa: 0.0040,
    kendaraan: 0.0250,
    pendidikan: 0.0120,
    unitlink: 0.0150,
  }[type]

  // Age multiplier — kurva sederhana
  const ageMult = 1 + Math.max(0, (a - 30)) * 0.025

  const smokerMult = smoker && (type === 'kesehatan' || type === 'jiwa') ? 1.4 : 1

  const annual = c * baseRate * ageMult * smokerMult
  const monthly = annual / 12

  // Rekomendasi coverage
  const recommendedCoverage = type === 'jiwa'
    ? a < 35
      ? c * 1
      : c
    : c

  return {
    type,
    coverage: c,
    age: a,
    smoker,
    annualPremiumIDR: Math.round(annual),
    monthlyPremiumIDR: Math.round(monthly),
    recommendedCoverageIDR: Math.round(recommendedCoverage),
    notes: [
      'Premi estimasi edukasi. Premi resmi tergantung underwriting individual.',
      type === 'jiwa'
        ? 'Aturan praktis: sum insured = 5–10× penghasilan tahunan.'
        : type === 'kesehatan'
        ? 'Tambah BPJS Kesehatan untuk jaring pengaman dasar.'
        : type === 'kendaraan'
        ? 'All Risk untuk mobil <5 tahun; TLO untuk mobil tua.'
        : 'Bandingkan biaya akuisisi & lock-in sebelum tanda tangan.',
    ],
    disclaimer:
      'Bukan kuotasi resmi. Hubungi perusahaan asuransi atau broker berlisensi untuk angka pasti.',
  }
}

/**
 * Recommendation engine — match user profile ke produk yang masuk akal.
 */
export function recommendInsurance({ age = 30, monthlyIncome = 0, dependents = 0, hasHealth = false, hasCar = false }) {
  const recs = []
  const monthlyBudget = monthlyIncome * 0.1 // ideal 5–10%

  if (!hasHealth) {
    recs.push({
      priority: 1,
      type: 'kesehatan',
      reason: 'Belum punya asuransi kesehatan — jaring pengaman wajib.',
      starter: 'BPJS Kesehatan Kelas 2 (Rp 100.000/bulan)',
      monthlyEstimate: 100_000,
    })
  }
  if (dependents > 0 && monthlyIncome > 0) {
    const sumInsured = monthlyIncome * 12 * (dependents >= 2 ? 10 : 7)
    recs.push({
      priority: 2,
      type: 'jiwa',
      reason: `Punya ${dependents} tanggungan — asuransi jiwa proteksi mereka.`,
      starter: `Term life sum insured ~ ${Math.round(sumInsured / 1_000_000)} juta`,
      monthlyEstimate: Math.round(sumInsured * 0.004 / 12 * (1 + Math.max(0, (age - 30)) * 0.025)),
    })
  }
  if (hasCar) {
    recs.push({
      priority: 3,
      type: 'kendaraan',
      reason: 'Punya mobil — proteksi kerugian.',
      starter: 'Garda Oto / Sinar Mas All Risk',
      monthlyEstimate: 200_000,
    })
  }
  if (age < 40 && monthlyIncome > 5_000_000) {
    recs.push({
      priority: 4,
      type: 'pendidikan',
      reason: 'Masih muda & berpenghasilan stabil — pendidikan/anak.',
      starter: 'Mandiri Edukasi atau reksadana edukasi (lebih fleksibel)',
      monthlyEstimate: 500_000,
    })
  }

  return {
    profile: { age, monthlyIncome, dependents, hasHealth, hasCar },
    monthlyBudgetIdeal: Math.round(monthlyBudget),
    recommendations: recs,
    disclaimer:
      'Rekomendasi edukasi. Konsultasi planner berlisensi untuk produk yang tepat dengan kondisimu.',
  }
}

export { COMPANIES, TYPES }
