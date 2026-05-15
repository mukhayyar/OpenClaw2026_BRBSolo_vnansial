import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { GlassPanel } from '../components/PageShell'

const API = import.meta.env.VITE_API_URL || ''

type Quote = {
  symbol: string
  shortName?: string
  regularMarketPrice?: number
  regularMarketChangePercent?: number
  currency?: string
  error?: string
}

type Holding = { symbol: string; shares: number }

const PORTFOLIO_KEY = 'vnansial-paper-portfolio'

const EXAMPLES = ['BBCA.JK', 'BBRI.JK', 'AAPL', 'MSFT', '^JKSE']

function fmt(n: number, currency = 'IDR') {
  if (!Number.isFinite(n)) return '—'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: currency === 'IDR' ? 'IDR' : 'USD',
    maximumFractionDigits: currency === 'IDR' ? 0 : 2,
  }).format(n)
}

function Sparkline({ points }: { points: { close: number }[] }) {
  if (!points.length) return null
  const vals = points.map(p => p.close)
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  const w = 120
  const h = 36
  const path = vals
    .map((v, i) => {
      const x = (i / (vals.length - 1 || 1)) * w
      const y = h - ((v - min) / (max - min || 1)) * h
      return `${i === 0 ? 'M' : 'L'}${x},${y}`
    })
    .join(' ')
  return (
    <svg width={w} height={h} className="text-cyan-400">
      <path d={path} fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  )
}

export default function RencanaInvestasi() {
  const [target, setTarget] = useState(50_000_000)
  const [months, setMonths] = useState(36)
  const [monthly, setMonthly] = useState(1_000_000)
  const [returnPct, setReturnPct] = useState(8)
  const [risk, setRisk] = useState<'conservative' | 'balanced' | 'aggressive'>('balanced')

  const [symbol, setSymbol] = useState('BBCA.JK')
  const [quote, setQuote] = useState<Quote | null>(null)
  const [history, setHistory] = useState<{ close: number }[]>([])
  const [searchQ, setSearchQ] = useState('')
  const [searchResults, setSearchResults] = useState<{ symbol: string; shortName: string }[]>([])

  const [holdings, setHoldings] = useState<Holding[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(PORTFOLIO_KEY) || '[]')
    } catch {
      return []
    }
  })
  const [portfolioQuotes, setPortfolioQuotes] = useState<Record<string, Quote>>({})
  const [newSym, setNewSym] = useState('AAPL')
  const [newShares, setNewShares] = useState(10)

  const goal = useMemo(() => {
    const rate = returnPct / 100 / 12
    let projected = 0
    for (let i = 0; i < months; i++) projected = projected * (1 + rate) + monthly
    const gap = target - projected
    return { projected, gap, onTrack: gap <= 0 }
  }, [target, months, monthly, returnPct])

  const allocation = useMemo(() => {
    const m = {
      conservative: { cash: 30, bonds: 40, stocks: 20, alt: 10 },
      balanced: { cash: 15, bonds: 35, stocks: 40, alt: 10 },
      aggressive: { cash: 5, bonds: 15, stocks: 70, alt: 10 },
    }[risk]
    return m
  }, [risk])

  useEffect(() => {
    localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(holdings))
  }, [holdings])

  useEffect(() => {
    if (!holdings.length) return
    holdings.forEach(async h => {
      const res = await fetch(`${API}/api/market/quote?symbol=${encodeURIComponent(h.symbol)}`)
      const data = await res.json()
      setPortfolioQuotes(q => ({ ...q, [h.symbol]: data }))
    })
  }, [holdings])

  async function loadQuote(sym: string) {
    setSymbol(sym)
    const [qRes, hRes] = await Promise.all([
      fetch(`${API}/api/market/quote?symbol=${encodeURIComponent(sym)}`),
      fetch(`${API}/api/market/history?symbol=${encodeURIComponent(sym)}&range=3mo`),
    ])
    setQuote(await qRes.json())
    const hist = await hRes.json()
    setHistory(hist.points || [])
  }

  async function doSearch() {
    if (!searchQ.trim()) return
    const res = await fetch(`${API}/api/market/search?q=${encodeURIComponent(searchQ)}`)
    const data = await res.json()
    setSearchResults(data.results || [])
  }

  const portfolioValue = holdings.reduce((sum, h) => {
    const q = portfolioQuotes[h.symbol]
    const price = q?.regularMarketPrice ?? 0
    return sum + price * h.shares
  }, 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="page-shell max-w-5xl"
    >
      <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-cyan-300 to-emerald-300 bg-clip-text text-transparent">
        📈 Rencana Investasi
      </h1>
      <p className="text-slate-400 mb-6 text-sm">
        Perencanaan edukasi + data pasar Yahoo Finance (delayed). Bukan saran investasi berlisensi OJK.
      </p>

      <div className="glass rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 mb-8 text-sm text-amber-200">
        ⚠️ <strong>Disclaimer:</strong> Simulasi dan kutipan harga untuk edukasi saja. Data dapat tertunda.
        Tidak menjamin return. Verifikasi di broker resmi &amp; OJK sebelum berinvestasi.
      </div>

      <motion.div className="grid lg:grid-cols-2 gap-6 mb-8">
        <GlassPanel className="space-y-4">
          <h2 className="text-lg font-bold">🎯 Perencana Tujuan</h2>
          <label className="block text-sm text-slate-400">
            Target (Rp)
            <input
              type="number"
              value={target}
              onChange={e => setTarget(Number(e.target.value))}
              className="mt-1 w-full input-glass rounded-lg px-3 py-2"
            />
          </label>
          <label className="block text-sm text-slate-400">
            Bulan
            <input
              type="number"
              value={months}
              onChange={e => setMonths(Number(e.target.value))}
              className="mt-1 w-full input-glass rounded-lg px-3 py-2"
            />
          </label>
          <label className="block text-sm text-slate-400">
            Iuran bulanan (Rp)
            <input
              type="number"
              value={monthly}
              onChange={e => setMonthly(Number(e.target.value))}
              className="mt-1 w-full input-glass rounded-lg px-3 py-2"
            />
          </label>
          <label className="block text-sm text-slate-400">
            Return tahunan asumsi (%)
            <input
              type="number"
              value={returnPct}
              onChange={e => setReturnPct(Number(e.target.value))}
              className="mt-1 w-full input-glass rounded-lg px-3 py-2"
            />
          </label>
          <div
            className={`p-4 rounded-xl border ${
              goal.onTrack
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
            }`}
          >
            <p>Proyeksi akhir: <strong>{fmt(goal.projected)}</strong></p>
            <p>{goal.onTrack ? '✅ On track' : `Kurang ~${fmt(goal.gap)}`}</p>
          </div>
        </GlassPanel>

        <GlassPanel className="space-y-4">
          <h2 className="text-lg font-bold">⚖️ Alokasi Aset (edukasi)</h2>
          <div className="flex gap-2 flex-wrap">
            {(['conservative', 'balanced', 'aggressive'] as const).map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setRisk(r)}
                className={`px-3 py-2 rounded-lg text-sm capitalize btn-glass ${
                  risk === r ? 'border-emerald-500/50 text-emerald-400' : ''
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <div className="space-y-2 text-sm">
            {Object.entries(allocation).map(([k, v]) => (
              <div key={k} className="flex items-center gap-2">
                <span className="w-16 capitalize text-slate-400">{k}</span>
                <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500" style={{ width: `${v}%` }} />
                </div>
                <span className="w-10 text-right">{v}%</span>
              </div>
            ))}
          </div>
        </GlassPanel>
      </motion.div>

      <GlassPanel className="mb-8 space-y-4">
        <h2 className="text-lg font-bold">📊 Kutipan Live (Yahoo Finance)</h2>
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map(s => (
            <button key={s} type="button" onClick={() => loadQuote(s)} className="text-xs btn-glass px-3 py-1.5 rounded-full">
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={symbol}
            onChange={e => setSymbol(e.target.value.toUpperCase())}
            placeholder="Simbol: BBCA.JK, AAPL"
            className="flex-1 input-glass rounded-lg px-3 py-2"
          />
          <button type="button" onClick={() => loadQuote(symbol)} className="btn-neon px-4 py-2 rounded-lg text-sm">
            Cek
          </button>
        </div>
        <div className="flex gap-2">
          <input
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            placeholder="Cari nama saham…"
            className="flex-1 input-glass rounded-lg px-3 py-2"
          />
          <button type="button" onClick={doSearch} className="btn-glass px-4 py-2 rounded-lg text-sm">
            Cari
          </button>
        </div>
        {searchResults.length > 0 && (
          <ul className="text-sm space-y-1">
            {searchResults.map(r => (
              <li key={r.symbol}>
                <button type="button" className="text-cyan-400 hover:underline" onClick={() => loadQuote(r.symbol)}>
                  {r.symbol}
                </button>
                {' — '}
                {r.shortName}
              </li>
            ))}
          </ul>
        )}
        {quote && !quote.error && (
          <div className="flex flex-wrap items-center gap-6 p-4 rounded-xl glass-neon border border-cyan-500/20">
            <div>
              <p className="text-2xl font-bold">{quote.shortName}</p>
              <p className="text-slate-500 font-mono text-sm">{quote.symbol}</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-emerald-400">
                {fmt(quote.regularMarketPrice ?? 0, quote.currency)}
              </p>
              <p className={quote.regularMarketChangePercent && quote.regularMarketChangePercent >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                {quote.regularMarketChangePercent?.toFixed(2)}%
              </p>
            </div>
            <Sparkline points={history} />
          </div>
        )}
        {quote?.error && <p className="text-red-400 text-sm">{quote.error}</p>}
      </GlassPanel>

      <GlassPanel className="space-y-4">
        <h2 className="text-lg font-bold">🧪 Portofolio Simulasi (kertas)</h2>
        <p className="text-xs text-slate-500">Tidak ada uang sungguhan — hanya demo dengan harga live.</p>
        <div className="flex gap-2 flex-wrap">
          <input
            value={newSym}
            onChange={e => setNewSym(e.target.value.toUpperCase())}
            placeholder="Simbol"
            className="w-28 input-glass rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="number"
            value={newShares}
            onChange={e => setNewShares(Number(e.target.value))}
            className="w-24 input-glass rounded-lg px-3 py-2 text-sm"
          />
          <button
            type="button"
            className="btn-neon px-4 py-2 rounded-lg text-sm"
            onClick={() => {
              if (!newSym) return
              setHoldings(h => [...h.filter(x => x.symbol !== newSym), { symbol: newSym, shares: newShares }])
            }}
          >
            Tambah
          </button>
        </div>
        <ul className="space-y-2 text-sm">
          {holdings.map(h => {
            const q = portfolioQuotes[h.symbol]
            const val = (q?.regularMarketPrice ?? 0) * h.shares
            return (
              <li key={h.symbol} className="flex justify-between items-center glass rounded-lg px-3 py-2">
                <span>
                  <strong>{h.symbol}</strong> × {h.shares}
                </span>
                <span className="text-emerald-400">{fmt(val, q?.currency)}</span>
                <button type="button" className="text-red-400 text-xs" onClick={() => setHoldings(x => x.filter(i => i.symbol !== h.symbol))}>
                  Hapus
                </button>
              </li>
            )
          })}
        </ul>
        {holdings.length > 0 && (
          <p className="text-lg font-bold text-cyan-300">Total simulasi: {fmt(portfolioValue, 'IDR')}</p>
        )}
      </GlassPanel>
    </motion.div>
  )
}
