import { useState } from 'react'
import Bento from '../components/Bento'

function calcLoan(principal: number, annualRate: number, months: number) {
  const r = annualRate / 100 / 12
  if (r === 0) return { monthly: principal / months, total: principal, interest: 0 }
  const monthly = principal * (r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1)
  const total = monthly * months
  return { monthly, total, interest: total - principal }
}

function calcFlatLoan(principal: number, annualRate: number, months: number) {
  const interest = principal * (annualRate / 100) * (months / 12)
  const total = principal + interest
  return { monthly: total / months, total, interest }
}

const PRESETS = [
  { label: 'KUR BRI', rate: 6, type: 'Kredit Usaha Rakyat', verdict: 'fair' as const },
  { label: 'KPR Bank', rate: 8.5, type: 'Kredit Pemilikan Rumah', verdict: 'fair' as const },
  { label: 'Kartu Kredit', rate: 24, type: 'Revolving Credit', verdict: 'warning' as const },
  { label: 'Pinjol Legal', rate: 36, type: 'P2P Lending (OJK)', verdict: 'warning' as const },
  { label: 'Pinjol Ilegal', rate: 365, type: '1%/hari = 365%/tahun', verdict: 'predatory' as const },
  { label: 'Rentenir', rate: 120, type: 'Lintah darat', verdict: 'predatory' as const },
]

const fmt = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

export default function KalkulatorPanel() {
  const [principal, setPrincipal] = useState(5_000_000)
  const [rate, setRate] = useState(24)
  const [months, setMonths] = useState(12)
  const [method, setMethod] = useState<'anuitas' | 'flat'>('anuitas')

  const result = method === 'anuitas' ? calcLoan(principal, rate, months) : calcFlatLoan(principal, rate, months)
  const effectiveRate = (result.total / principal - 1) * 100
  const verdict = rate <= 15 ? 'fair' : rate <= 40 ? 'warning' : 'predatory'

  return (
    <>
      <div className="grid lg:grid-cols-5 gap-4 sm:gap-6 mb-6">
        <Bento padding="lg" className="lg:col-span-2 space-y-5">
          <div>
            <label className="vn-eyebrow mb-2 block">Jumlah pinjaman</label>
            <input type="number" value={principal} onChange={e => setPrincipal(Number(e.target.value))} className="vn-input" />
            <input
              type="range" min={500_000} max={100_000_000} step={500_000} value={principal}
              onChange={e => setPrincipal(Number(e.target.value))}
              className="w-full mt-3 accent-[var(--vn-forest)]"
            />
          </div>
          <div>
            <label className="vn-eyebrow mb-2 block flex items-center gap-2">
              Bunga per tahun
              <span className={`text-[16px] font-bold ${rate <= 15 ? 'text-[var(--vn-forest)]' : rate <= 40 ? 'text-[var(--vn-amber)]' : 'text-[var(--vn-red)]'}`}>{rate}%</span>
            </label>
            <input type="range" min={1} max={400} value={rate} onChange={e => setRate(Number(e.target.value))} className="w-full accent-[var(--vn-forest)]" />
          </div>
          <div>
            <label className="vn-eyebrow mb-2 block">Tenor · {months} bulan</label>
            <input type="range" min={1} max={60} value={months} onChange={e => setMonths(Number(e.target.value))} className="w-full accent-[var(--vn-forest)]" />
          </div>
          <div>
            <label className="vn-eyebrow mb-2 block">Metode bunga</label>
            <div className="grid grid-cols-2 gap-2">
              {(['anuitas', 'flat'] as const).map(m => (
                <button key={m} onClick={() => setMethod(m)} className={`py-2.5 rounded-full text-[13px] font-semibold transition-colors ${method === m ? 'bg-[var(--vn-forest)] text-white' : 'bg-[var(--vn-bg-deep)] text-[var(--vn-ink-soft)]'}`}>
                  {m === 'anuitas' ? 'Anuitas (efektif)' : 'Flat'}
                </button>
              ))}
            </div>
          </div>
        </Bento>

        <Bento tone={verdict === 'predatory' ? 'ink' : verdict === 'warning' ? 'mint' : 'cream'} padding="lg" className="lg:col-span-3">
          <p className={`vn-eyebrow mb-3 ${verdict === 'predatory' ? '!text-[var(--vn-mint)]' : ''}`}>Hasil</p>
          <h2 className={`vn-display text-[28px] sm:text-[36px] mb-1 ${verdict === 'fair' ? 'text-[var(--vn-forest-dark)]' : verdict === 'warning' ? 'text-[var(--vn-ink)]' : 'text-white'}`}>
            {verdict === 'fair' ? 'Pinjaman wajar' : verdict === 'warning' ? 'Hati-hati' : 'Predatory!'}
          </h2>
          <p className={`text-[14px] mb-6 ${verdict === 'predatory' ? 'text-white/75' : 'text-[var(--vn-ink-soft)]'}`}>
            {verdict === 'fair' ? 'Bunga relatif sehat untuk pinjaman jangka pendek.' : verdict === 'warning' ? 'Bunga tinggi. Pastikan kamu paham total cicilan.' : 'Bunga sangat berbahaya. Cari alternatif pinjaman resmi.'}
          </p>
          <dl className={`grid grid-cols-2 gap-4 text-[14px] ${verdict === 'predatory' ? 'text-white' : 'text-[var(--vn-ink)]'}`}>
            <div>
              <dt className={`text-[12px] ${verdict === 'predatory' ? 'text-white/65' : 'text-[var(--vn-muted)]'}`}>Cicilan/bulan</dt>
              <dd className="vn-headline text-[22px]">{fmt(result.monthly)}</dd>
            </div>
            <div>
              <dt className={`text-[12px] ${verdict === 'predatory' ? 'text-white/65' : 'text-[var(--vn-muted)]'}`}>Total bayar</dt>
              <dd className="vn-headline text-[22px]">{fmt(result.total)}</dd>
            </div>
            <div>
              <dt className={`text-[12px] ${verdict === 'predatory' ? 'text-white/65' : 'text-[var(--vn-muted)]'}`}>Total bunga</dt>
              <dd className="vn-headline text-[22px]">{fmt(result.interest)}</dd>
            </div>
            <div>
              <dt className={`text-[12px] ${verdict === 'predatory' ? 'text-white/65' : 'text-[var(--vn-muted)]'}`}>Bunga efektif</dt>
              <dd className="vn-headline text-[22px]">{effectiveRate.toFixed(1)}%</dd>
            </div>
          </dl>
          {verdict === 'predatory' && (
            <p className="mt-6 text-[13px] text-white/80 leading-relaxed">
              Kamu akan membayar bunga {(result.interest / principal).toFixed(1)}× lipat dari pinjaman pokokmu. Jangan ambil.
            </p>
          )}
        </Bento>
      </div>

      <div>
        <p className="vn-eyebrow mb-4">Perbandingan jenis pinjaman</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {PRESETS.map(p => {
            const r = calcLoan(principal, p.rate, months)
            return (
              <button
                key={p.label}
                onClick={() => setRate(p.rate)}
                className={`bento bento-pad text-left transition-transform ${p.verdict === 'fair' ? 'bento-cream' : p.verdict === 'warning' ? 'bento-mint' : ''}`}
                style={p.verdict === 'predatory' ? { background: 'var(--vn-red-soft)', borderColor: 'rgba(185, 28, 28, 0.18)' } : undefined}
              >
                <span className={`vn-chip ${p.verdict === 'predatory' ? 'vn-chip-red' : p.verdict === 'warning' ? 'vn-chip-amber' : ''}`}>{p.rate}% per tahun</span>
                <p className="vn-headline text-[18px] mt-3">{p.label}</p>
                <p className="text-[12px] text-[var(--vn-muted)] mb-2">{p.type}</p>
                <p className="text-[13px] text-[var(--vn-ink-soft)]">Cicilan: <strong>{fmt(r.monthly)}</strong></p>
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}
