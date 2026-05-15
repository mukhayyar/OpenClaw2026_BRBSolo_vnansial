import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import PageShell from '../components/PageShell'
import Bento from '../components/Bento'
import MoneyInput from '../components/MoneyInput'

const API = import.meta.env.VITE_API_URL || ''

type Plan = { name: string; premiumMonthly: number; notes: string }
type Company = {
  id: string
  name: string
  type: string
  description: string
  plans: Plan[]
  pros: string[]
  cons: string[]
  website: string
}

type Premium = {
  type: string
  coverage: number
  age: number
  smoker: boolean
  annualPremiumIDR: number
  monthlyPremiumIDR: number
  notes: string[]
}

const TYPES = [
  { id: '', label: 'Semua' },
  { id: 'kesehatan', label: 'Kesehatan' },
  { id: 'jiwa', label: 'Jiwa' },
  { id: 'kendaraan', label: 'Kendaraan' },
  { id: 'pendidikan', label: 'Pendidikan' },
  { id: 'unitlink', label: 'Unit Link' },
]

function fmt(n: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n)
}

export default function Asuransi() {
  const [filter, setFilter] = useState('')
  const [companies, setCompanies] = useState<Company[]>([])

  const [calcType, setCalcType] = useState('jiwa')
  const [coverage, setCoverage] = useState(500_000_000)
  const [age, setAge] = useState(30)
  const [smoker, setSmoker] = useState(false)
  const [premium, setPremium] = useState<Premium | null>(null)

  const [profile, setProfile] = useState({
    age: 30,
    monthlyIncome: 8_000_000,
    dependents: 1,
    hasHealth: false,
    hasCar: true,
  })
  const [reco, setReco] = useState<any>(null)

  useEffect(() => {
    const url = filter ? `${API}/api/insurance?type=${filter}` : `${API}/api/insurance`
    fetch(url)
      .then(r => r.json())
      .then(d => setCompanies(d.companies || []))
  }, [filter])

  async function calc() {
    const res = await fetch(`${API}/api/insurance/premium`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: calcType, coverage, age, smoker }),
    })
    setPremium(await res.json())
  }

  async function recommend() {
    const res = await fetch(`${API}/api/insurance/recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    })
    setReco(await res.json())
  }

  const grouped = useMemo(() => {
    return companies.reduce<Record<string, Company[]>>((acc, c) => {
      ;(acc[c.type] ||= []).push(c)
      return acc
    }, {})
  }, [companies])

  return (
    <PageShell
      eyebrow="Asuransi Indonesia"
      title="Lindungi keluargamu, paham preminya."
      subtitle="Bandingkan BPJS Kesehatan, asuransi jiwa, kendaraan, pendidikan, dan unit link. Estimasi premi dalam Rupiah."
    >
      <Bento padding="lg" className="mb-6">
        <p className="vn-eyebrow mb-3">Filter jenis</p>
        <div className="flex flex-wrap gap-2">
          {TYPES.map(t => (
            <button
              key={t.id}
              onClick={() => setFilter(t.id)}
              className={`px-4 py-2 rounded-full text-[13px] font-semibold transition-colors ${
                filter === t.id
                  ? 'bg-[var(--vn-forest)] text-white'
                  : 'bg-[var(--vn-bg-deep)] text-[var(--vn-ink-soft)]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </Bento>

      <div className="grid md:grid-cols-2 gap-4 sm:gap-6 mb-12">
        {companies.map((c, i) => (
          <Bento key={c.id} delay={i * 0.04} padding="lg">
            <div className="flex items-start justify-between mb-3 gap-3">
              <div>
                <p className="vn-eyebrow mb-1 capitalize">{c.type}</p>
                <h3 className="vn-headline text-[20px]">{c.name}</h3>
              </div>
              <a
                href={c.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[12px] text-[var(--vn-forest)] hover:underline"
              >
                Situs ↗
              </a>
            </div>
            <p className="text-[13.5px] text-[var(--vn-ink-soft)] mb-4">{c.description}</p>
            <ul className="space-y-2 mb-4">
              {c.plans.map(p => (
                <li
                  key={p.name}
                  className="flex justify-between items-baseline bg-[var(--vn-bg-deep)] rounded-2xl px-3.5 py-2.5"
                >
                  <div>
                    <p className="font-semibold text-[13.5px]">{p.name}</p>
                    <p className="text-[11px] text-[var(--vn-muted)]">{p.notes}</p>
                  </div>
                  <p className="vn-headline text-[14px] text-[var(--vn-forest-dark)]">
                    {fmt(p.premiumMonthly)}/bln
                  </p>
                </li>
              ))}
            </ul>
            <div className="grid grid-cols-2 gap-3 text-[12.5px] leading-relaxed">
              <div>
                <p className="vn-eyebrow mb-1.5">Plus</p>
                <ul className="text-[var(--vn-forest-dark)] space-y-1">
                  {c.pros.map((p, j) => <li key={j}>· {p}</li>)}
                </ul>
              </div>
              <div>
                <p className="vn-eyebrow mb-1.5">Minus</p>
                <ul className="text-[var(--vn-red)] space-y-1">
                  {c.cons.map((p, j) => <li key={j}>· {p}</li>)}
                </ul>
              </div>
            </div>
          </Bento>
        ))}
        {!companies.length && (
          <p className="text-[var(--vn-muted)] col-span-2">Tidak ada data.</p>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        <Bento padding="lg" tone="cream">
          <p className="vn-eyebrow mb-3">Kalkulator premi</p>
          <h3 className="vn-headline text-[22px] mb-4">Estimasi premi bulanan.</h3>
          <div className="space-y-4">
            <label className="block text-[13px]">
              Jenis
              <select
                value={calcType}
                onChange={e => setCalcType(e.target.value)}
                className="vn-input mt-1"
              >
                <option value="kesehatan">Kesehatan</option>
                <option value="jiwa">Jiwa</option>
                <option value="kendaraan">Kendaraan</option>
                <option value="pendidikan">Pendidikan</option>
                <option value="unitlink">Unit Link</option>
              </select>
            </label>
            <div className="block text-[13px]">
              <label>Coverage (sum insured)</label>
              <div className="mt-1">
                <MoneyInput value={coverage} onChange={setCoverage} />
              </div>
            </div>
            <label className="block text-[13px]">
              Usia
              <input type="number" value={age} onChange={e => setAge(Number(e.target.value))} className="vn-input mt-1" />
            </label>
            <label className="flex items-center gap-2 text-[13px]">
              <input type="checkbox" checked={smoker} onChange={e => setSmoker(e.target.checked)} className="accent-[var(--vn-forest)]" />
              Perokok
            </label>
            <button onClick={calc} className="vn-btn vn-btn-primary">
              Hitung premi
            </button>
          </div>
          {premium && !('error' in premium) && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5 p-4 rounded-2xl bg-white border border-[var(--vn-line)]">
              <p className="text-[12px] text-[var(--vn-muted)] uppercase tracking-wider">Estimasi</p>
              <p className="vn-display text-[28px] text-[var(--vn-forest-dark)]">{fmt(premium.monthlyPremiumIDR)}/bulan</p>
              <p className="text-[12px] text-[var(--vn-muted)]">~{fmt(premium.annualPremiumIDR)}/tahun</p>
              {premium.notes?.length > 0 && (
                <ul className="mt-3 space-y-1 text-[12px] text-[var(--vn-ink-soft)]">
                  {premium.notes.map((n, i) => <li key={i}>· {n}</li>)}
                </ul>
              )}
            </motion.div>
          )}
        </Bento>

        <Bento padding="lg" tone="mint">
          <p className="vn-eyebrow mb-3">Rekomendasi personal</p>
          <h3 className="vn-headline text-[22px] mb-4">Apa yang cocok untukku?</h3>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <label className="block text-[13px]">
              Usia
              <input type="number" value={profile.age} onChange={e => setProfile(p => ({ ...p, age: Number(e.target.value) }))} className="vn-input mt-1" />
            </label>
            <div className="block text-[13px]">
              <label>Penghasilan/bulan</label>
              <div className="mt-1">
                <MoneyInput value={profile.monthlyIncome} onChange={v => setProfile(p => ({ ...p, monthlyIncome: v }))} />
              </div>
            </div>
            <label className="block text-[13px]">
              Tanggungan
              <input type="number" value={profile.dependents} onChange={e => setProfile(p => ({ ...p, dependents: Number(e.target.value) }))} className="vn-input mt-1" />
            </label>
            <div className="space-y-2 text-[13px]">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={profile.hasHealth} onChange={e => setProfile(p => ({ ...p, hasHealth: e.target.checked }))} className="accent-[var(--vn-forest)]" />
                Sudah punya asuransi kesehatan
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={profile.hasCar} onChange={e => setProfile(p => ({ ...p, hasCar: e.target.checked }))} className="accent-[var(--vn-forest)]" />
                Punya mobil
              </label>
            </div>
          </div>
          <button onClick={recommend} className="vn-btn vn-btn-primary">
            Beri rekomendasi
          </button>
          {reco?.recommendations && (
            <ul className="mt-4 space-y-2">
              {reco.recommendations.map((r: any, i: number) => (
                <li key={i} className="p-3 rounded-2xl bg-white">
                  <p className="vn-eyebrow capitalize">{r.type}</p>
                  <p className="text-[13.5px] mt-1">{r.reason}</p>
                  <p className="text-[12.5px] text-[var(--vn-muted)] mt-1">
                    Starter: {r.starter} · ~{fmt(r.monthlyEstimate)}/bulan
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Bento>
      </div>

      {Object.keys(grouped).length > 0 && filter === '' && (
        <p className="mt-8 text-[12px] text-[var(--vn-muted)]">
          Premi adalah estimasi berdasarkan kisaran pasar. Untuk angka resmi, hubungi perusahaan asuransi atau broker berlisensi.
        </p>
      )}
    </PageShell>
  )
}
