import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import PageShell from '../components/PageShell'
import Bento from '../components/Bento'
import LandscapeHero from '../components/LandscapeHero'
import { scoreFinancialHealth, type HealthInput, type Pillar } from '../lib/healthScore'

const STORAGE_KEY = 'vnansial-health-input'

const DEFAULT_INPUT: HealthInput = {
  monthlyIncome: 6_000_000,
  monthlyExpense: 4_200_000,
  emergencyFund: 8_000_000,
  totalDebt: 12_000_000,
  monthlySavings: 900_000,
}

function fmt(n: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n)
}

function pillarToneClass(verdict: string) {
  const v = verdict.toLowerCase()
  if (v.startsWith('sangat sehat') || v === 'rendah' || v === 'sangat aman' || v === 'ideal' || v === 'luar biasa')
    return 'text-[var(--vn-forest-dark)] bg-[var(--vn-cream)]'
  if (v === 'sehat' || v === 'aman' || v === 'cukup' || v === 'pas-pasan')
    return 'text-[var(--vn-forest-dark)] bg-[var(--vn-mint-soft)]'
  if (v === 'impas' || v === 'rentan' || v === 'tinggi' || v === 'minim')
    return 'text-[#92400e] bg-[var(--vn-amber-soft)]'
  if (v === 'defisit' || v === 'sangat rentan' || v === 'sangat tinggi' || v === 'belum menabung')
    return 'text-[var(--vn-red)] bg-[var(--vn-red-soft)]'
  return 'text-[var(--vn-ink-soft)] bg-[var(--vn-bg-deep)]'
}

const PILLARS = [
  { key: 'budget', title: 'Anggaran', detail: 'Pengeluaran vs pemasukan bulanan.' },
  { key: 'emergencyFund', title: 'Dana Darurat', detail: 'Berapa bulan kamu bisa bertahan tanpa pemasukan.' },
  { key: 'debt', title: 'Hutang', detail: 'Total hutang dibanding penghasilan tahunan.' },
  { key: 'savings', title: 'Tabungan', detail: 'Persentase penghasilan yang ditabung.' },
] as const

export default function KesehatanFinansial() {
  const [input, setInput] = useState<HealthInput>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? { ...DEFAULT_INPUT, ...JSON.parse(raw) } : DEFAULT_INPUT
    } catch {
      return DEFAULT_INPUT
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(input))
  }, [input])

  const result = useMemo(() => scoreFinancialHealth(input), [input])
  const pct = result.score

  function update<K extends keyof HealthInput>(key: K, value: number) {
    setInput(prev => ({ ...prev, [key]: Math.max(0, value || 0) }))
  }

  function reset() {
    setInput(DEFAULT_INPUT)
  }

  return (
    <PageShell
      eyebrow="Skor kesehatan"
      title="Sehatkah keuanganmu hari ini?"
      subtitle="Empat pilar, satu skor. Isi penghasilan dan pengeluaranmu — kami beri saran praktis."
    >
      {/* Score hero */}
      <div className="landscape-hero mb-8" style={{ minHeight: 420 }}>
        <div className="bento-pad-lg grid lg:grid-cols-[1fr_auto] gap-8 items-center h-full">
          <div>
            <span className="vn-chip mb-4">
              <span className="vn-dot vn-pulse" /> Empat pilar literasi keuangan
            </span>
            <h2 className="vn-display text-[44px] sm:text-[56px] leading-[1.05] mb-3">
              Skor kamu <span className="vn-text-gradient">{pct}/100</span>
            </h2>
            <p className="text-[18px] text-[var(--vn-ink-soft)] max-w-xl">
              <strong className="text-[var(--vn-forest-dark)]">{result.overall}.</strong>{' '}
              {result.recommendations[0]}
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              <button onClick={reset} className="vn-btn vn-btn-secondary">
                Reset ke contoh
              </button>
              <a href="/asisten" className="vn-btn vn-btn-primary">
                Diskusi dengan Asisten
              </a>
            </div>
          </div>

          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
            className="vn-score-ring mx-auto"
            style={{ ['--pct' as never]: pct, ['--size' as never]: '220px' }}
          >
            <div className="text-center">
              <p className="vn-display text-[56px] text-[var(--vn-forest-dark)]">{pct}</p>
              <p className="vn-eyebrow">{result.overall}</p>
            </div>
          </motion.div>
        </div>
        <LandscapeHero height={170} />
      </div>

      {/* Inputs + per-pillar */}
      <div className="grid lg:grid-cols-5 gap-4 sm:gap-6">
        <Bento padding="lg" className="lg:col-span-2 space-y-4">
          <p className="vn-eyebrow mb-2">Datamu</p>
          <h3 className="vn-headline text-[22px] mb-1">Isi atau geser.</h3>
          <p className="text-[13px] text-[var(--vn-muted)] mb-4">
            Tersimpan otomatis di browser kamu — tidak dikirim ke siapa pun.
          </p>

          <Field
            label="Penghasilan bulanan"
            value={input.monthlyIncome}
            onChange={v => update('monthlyIncome', v)}
            max={50_000_000}
            step={250_000}
          />
          <Field
            label="Pengeluaran bulanan"
            value={input.monthlyExpense}
            onChange={v => update('monthlyExpense', v)}
            max={50_000_000}
            step={250_000}
          />
          <Field
            label="Saldo dana darurat"
            value={input.emergencyFund}
            onChange={v => update('emergencyFund', v)}
            max={200_000_000}
            step={500_000}
          />
          <Field
            label="Total hutang aktif"
            value={input.totalDebt}
            onChange={v => update('totalDebt', v)}
            max={500_000_000}
            step={500_000}
          />
          <Field
            label="Tabungan per bulan"
            value={input.monthlySavings}
            onChange={v => update('monthlySavings', v)}
            max={20_000_000}
            step={100_000}
          />
        </Bento>

        <div className="lg:col-span-3 grid sm:grid-cols-2 gap-4 sm:gap-6 content-start">
          {PILLARS.map((p, i) => {
            const pillar = result.pillars[p.key] as Pillar
            const verdictCls = pillarToneClass(pillar.verdict)
            return (
              <Bento key={p.key} delay={i * 0.04} padding="md">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="vn-eyebrow mb-1">{p.title}</p>
                    <p className="vn-headline text-[28px]">
                      {pillar.score}
                      <span className="text-[var(--vn-muted)] text-[16px] font-medium"> /25</span>
                    </p>
                  </div>
                  <span className={`text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${verdictCls}`}>
                    {pillar.verdict}
                  </span>
                </div>
                <p className="text-[12.5px] text-[var(--vn-muted)] mb-3">{p.detail}</p>
                <div className="h-1.5 rounded-full bg-[var(--vn-bg-deep)] overflow-hidden mb-3">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(pillar.score / 25) * 100}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="h-full"
                    style={{ background: 'linear-gradient(90deg, #4f9d63 0%, #2f7d3a 100%)' }}
                  />
                </div>
                <p className="text-[13px] text-[var(--vn-ink-soft)] leading-relaxed">{pillar.tip}</p>
              </Bento>
            )
          })}
        </div>
      </div>

      {/* Recommendations */}
      <Bento padding="lg" tone="ink" className="mt-8">
        <p className="vn-eyebrow !text-[var(--vn-mint)] mb-3">Langkah selanjutnya</p>
        <h3 className="vn-headline text-[24px] mb-5 text-white">
          Tiga hal kecil yang bisa kamu lakukan minggu ini.
        </h3>
        <ol className="space-y-3">
          {result.recommendations.slice(0, 4).map((r, i) => (
            <li
              key={i}
              className="flex gap-4 items-start bg-white/5 rounded-2xl px-4 py-3"
            >
              <span className="w-8 h-8 grid place-items-center rounded-full bg-[var(--vn-mint)] text-[var(--vn-forest-dark)] vn-headline text-[14px] shrink-0">
                {i + 1}
              </span>
              <p className="text-[14.5px] text-white/90 leading-relaxed">{r}</p>
            </li>
          ))}
        </ol>
        <p className="mt-6 text-[12px] text-white/55 leading-relaxed">{result.disclaimer}</p>
      </Bento>
    </PageShell>
  )
}

function Field({
  label,
  value,
  onChange,
  max,
  step,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  max: number
  step: number
}) {
  return (
    <div>
      <div className="flex justify-between items-baseline mb-1.5">
        <label className="text-[12px] text-[var(--vn-muted)] font-medium uppercase tracking-wider">{label}</label>
        <span className="vn-headline text-[15px] text-[var(--vn-forest-dark)]">{fmt(value)}</span>
      </div>
      <input
        type="range"
        min={0}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-[var(--vn-forest)]"
      />
      <input
        type="number"
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="vn-input mt-2 !py-2 text-[13px]"
      />
    </div>
  )
}
