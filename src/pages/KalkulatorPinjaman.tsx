import { useState } from 'react'
import { motion } from 'framer-motion'

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
  { label: 'Pinjol Ilegal', rate: 365, type: '1%/hari = 365%/tahun!', verdict: 'predatory' as const },
  { label: 'Rentenir', rate: 120, type: 'Rentenir / Lintah Darat', verdict: 'predatory' as const },
]

export default function KalkulatorPinjaman() {
  const [principal, setPrincipal] = useState(5000000)
  const [rate, setRate] = useState(24)
  const [months, setMonths] = useState(12)
  const [method, setMethod] = useState<'anuitas' | 'flat'>('anuitas')

  const result = method === 'anuitas'
    ? calcLoan(principal, rate, months)
    : calcFlatLoan(principal, rate, months)

  const effectiveRate = ((result.total / principal - 1) * 100)
  const verdict = rate <= 15 ? 'fair' : rate <= 40 ? 'warning' : 'predatory'

  const fmt = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold mb-2">🧮 Kalkulator Pinjaman</h1>
        <p className="text-slate-400 mb-8">
          Bandingkan pinjaman wajar vs predator. Lihat bunga tersembunyi sebelum kamu terjebak.
        </p>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Input */}
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Jumlah Pinjaman</label>
              <input
                type="number"
                value={principal}
                onChange={e => setPrincipal(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-500/50"
              />
              <input
                type="range"
                min={500000}
                max={100000000}
                step={500000}
                value={principal}
                onChange={e => setPrincipal(Number(e.target.value))}
                className="w-full mt-2 accent-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Bunga per Tahun: <span className={`font-bold ${
                  rate <= 15 ? 'text-emerald-400' : rate <= 40 ? 'text-amber-400' : 'text-red-400'
                }`}>{rate}%</span>
              </label>
              <input
                type="range"
                min={1}
                max={400}
                value={rate}
                onChange={e => setRate(Number(e.target.value))}
                className="w-full accent-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Tenor: {months} bulan</label>
              <input
                type="range"
                min={1}
                max={60}
                value={months}
                onChange={e => setMonths(Number(e.target.value))}
                className="w-full accent-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Metode Bunga</label>
              <div className="flex gap-2">
                {(['anuitas', 'flat'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => setMethod(m)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                      method === m
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-white/5 text-slate-400 border border-white/10'
                    }`}
                  >
                    {m === 'anuitas' ? 'Anuitas (Efektif)' : 'Flat'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Result */}
          <div className="space-y-4">
            <div className={`p-6 rounded-2xl border ${
              verdict === 'fair'
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : verdict === 'warning'
                ? 'bg-amber-500/10 border-amber-500/30'
                : 'bg-red-500/10 border-red-500/30'
            }`}>
              <div className="text-center mb-4">
                <div className="text-4xl mb-2">
                  {verdict === 'fair' ? '✅' : verdict === 'warning' ? '⚠️' : '🚫'}
                </div>
                <div className={`text-lg font-bold ${
                  verdict === 'fair' ? 'text-emerald-400' : verdict === 'warning' ? 'text-amber-400' : 'text-red-400'
                }`}>
                  {verdict === 'fair' ? 'PINJAMAN WAJAR' : verdict === 'warning' ? 'HATI-HATI' : 'PREDATORY LENDING!'}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Cicilan/bulan</span>
                  <span className="font-bold text-white">{fmt(result.monthly)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Total bayar</span>
                  <span className="font-bold text-white">{fmt(result.total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Total bunga</span>
                  <span className={`font-bold ${verdict === 'predatory' ? 'text-red-400' : 'text-amber-400'}`}>
                    {fmt(result.interest)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Bunga efektif total</span>
                  <span className="font-bold text-white">{effectiveRate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Rasio bunga/pokok</span>
                  <span className={`font-bold ${result.interest > principal ? 'text-red-400' : 'text-slate-300'}`}>
                    {(result.interest / principal * 100).toFixed(0)}%
                    {result.interest > principal && ' 🚩 Bunga > pokok!'}
                  </span>
                </div>
              </div>
            </div>

            {verdict === 'predatory' && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-300">
                <strong>⚠️ PERINGATAN:</strong> Kamu akan membayar{' '}
                <strong>{fmt(result.interest)}</strong> hanya untuk bunga!
                Ini {(result.interest / principal).toFixed(1)}x lipat dari pinjaman asli.
                <strong> JANGAN ambil pinjaman ini.</strong>
              </div>
            )}
          </div>
        </div>

        {/* Presets */}
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
          <h2 className="text-lg font-bold mb-4">📊 Perbandingan Jenis Pinjaman</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {PRESETS.map(p => {
              const r = calcLoan(principal, p.rate, months)
              return (
                <button
                  key={p.label}
                  onClick={() => setRate(p.rate)}
                  className={`p-4 rounded-xl text-left transition-all hover:scale-[1.02] border ${
                    p.verdict === 'fair'
                      ? 'bg-emerald-500/5 border-emerald-500/20'
                      : p.verdict === 'warning'
                      ? 'bg-amber-500/5 border-amber-500/20'
                      : 'bg-red-500/5 border-red-500/20'
                  }`}
                >
                  <div className="font-bold text-sm mb-1">{p.label}</div>
                  <div className="text-xs text-slate-500 mb-2">{p.type}</div>
                  <div className="text-xs text-slate-400">
                    {p.rate}%/thn → cicilan {fmt(r.monthly)}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
