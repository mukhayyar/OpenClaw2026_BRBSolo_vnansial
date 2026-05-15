import { useEffect, useMemo, useState } from 'react'
import PageShell from '../components/PageShell'
import Bento from '../components/Bento'
import MoneyInput from '../components/MoneyInput'

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
  const w = 160
  const h = 48
  const path = vals
    .map((v, i) => {
      const x = (i / (vals.length - 1 || 1)) * w
      const y = h - ((v - min) / (max - min || 1)) * h
      return `${i === 0 ? 'M' : 'L'}${x},${y}`
    })
    .join(' ')
  return (
    <svg width={w} height={h} className="text-[var(--vn-forest)]">
      <path d={path} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
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
    return {
      conservative: { cash: 30, bonds: 40, stocks: 20, alt: 10 },
      balanced: { cash: 15, bonds: 35, stocks: 40, alt: 10 },
      aggressive: { cash: 5, bonds: 15, stocks: 70, alt: 10 },
    }[risk]
  }, [risk])

  useEffect(() => {
    localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(holdings))
  }, [holdings])

  useEffect(() => {
    if (!holdings.length) return
    holdings.forEach(async h => {
      try {
        const res = await fetch(`${API}/api/market/quote?symbol=${encodeURIComponent(h.symbol)}`)
        const data = await res.json()
        setPortfolioQuotes(q => ({ ...q, [h.symbol]: data }))
      } catch {
        // ignore offline
      }
    })
  }, [holdings])

  async function loadQuote(sym: string) {
    setSymbol(sym)
    try {
      const [qRes, hRes] = await Promise.all([
        fetch(`${API}/api/market/quote?symbol=${encodeURIComponent(sym)}`),
        fetch(`${API}/api/market/history?symbol=${encodeURIComponent(sym)}&range=3mo`),
      ])
      setQuote(await qRes.json())
      const hist = await hRes.json()
      setHistory(hist.points || [])
    } catch {
      setQuote({ symbol: sym, error: 'Server tidak tersambung' })
    }
  }

  async function doSearch() {
    if (!searchQ.trim()) return
    try {
      const res = await fetch(`${API}/api/market/search?q=${encodeURIComponent(searchQ)}`)
      const data = await res.json()
      setSearchResults(data.results || [])
    } catch {
      setSearchResults([])
    }
  }

  const portfolioValue = holdings.reduce((sum, h) => {
    const q = portfolioQuotes[h.symbol]
    const price = q?.regularMarketPrice ?? 0
    return sum + price * h.shares
  }, 0)

  return (
    <PageShell
      eyebrow="Pertumbuhan"
      title="Rencana investasi yang sabar dan masuk akal."
      subtitle="Simulasi target tabungan, alokasi aset edukasi, dan harga pasar real-time (delayed). Bukan saran investasi berlisensi OJK."
    >
      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 mb-8">
        <Bento padding="lg" tone="cream">
          <p className="vn-eyebrow mb-3">Perencana tujuan</p>
          <h3 className="vn-headline text-[22px] mb-5">Target tabungan kamu.</h3>
          <div className="space-y-4">
            <div className="block text-[13px] text-[var(--vn-ink-soft)]">
              <label>Target</label>
              <div className="mt-1">
                <MoneyInput value={target} onChange={setTarget} />
              </div>
            </div>
            <label className="block text-[13px] text-[var(--vn-ink-soft)]">
              Tenor (bulan)
              <input type="number" value={months} onChange={e => setMonths(Number(e.target.value))} className="vn-input mt-1" />
            </label>
            <div className="block text-[13px] text-[var(--vn-ink-soft)]">
              <label>Iuran bulanan</label>
              <div className="mt-1">
                <MoneyInput value={monthly} onChange={setMonthly} />
              </div>
            </div>
            <label className="block text-[13px] text-[var(--vn-ink-soft)]">
              Asumsi return tahunan (%)
              <input type="number" value={returnPct} onChange={e => setReturnPct(Number(e.target.value))} className="vn-input mt-1" />
            </label>
          </div>
          <div
            className={`mt-5 p-4 rounded-2xl border ${
              goal.onTrack
                ? 'bg-[var(--vn-cream)] border-[var(--vn-forest)]/20 text-[var(--vn-forest-dark)]'
                : 'bg-[var(--vn-amber-soft)] border-[var(--vn-amber)]/20 text-[#92400e]'
            }`}
          >
            <p className="text-[13px] mb-1">Proyeksi akhir</p>
            <p className="vn-headline text-[22px]">{fmt(goal.projected)}</p>
            <p className="text-[13px] mt-1">
              {goal.onTrack ? '✓ Sesuai target' : `Masih kurang ~${fmt(goal.gap)}`}
            </p>
          </div>
        </Bento>

        <Bento padding="lg">
          <p className="vn-eyebrow mb-3">Alokasi aset (edukasi)</p>
          <h3 className="vn-headline text-[22px] mb-5">Profil risiko.</h3>
          <div className="flex gap-2 mb-6 flex-wrap">
            {(['conservative', 'balanced', 'aggressive'] as const).map(r => (
              <button
                key={r}
                onClick={() => setRisk(r)}
                className={`px-4 py-2 rounded-full text-[13px] font-semibold transition-colors ${
                  risk === r
                    ? 'bg-[var(--vn-forest)] text-white'
                    : 'bg-[var(--vn-bg-deep)] text-[var(--vn-ink-soft)]'
                }`}
              >
                {r === 'conservative' ? 'Konservatif' : r === 'balanced' ? 'Seimbang' : 'Agresif'}
              </button>
            ))}
          </div>
          <div className="space-y-3">
            {Object.entries(allocation).map(([k, v]) => (
              <div key={k}>
                <div className="flex justify-between text-[13px] mb-1.5">
                  <span className="capitalize">{k === 'alt' ? 'Alternatif' : k === 'cash' ? 'Kas' : k === 'bonds' ? 'Obligasi' : 'Saham'}</span>
                  <span className="font-semibold text-[var(--vn-forest-dark)]">{v}%</span>
                </div>
                <div className="h-2 rounded-full bg-[var(--vn-bg-deep)] overflow-hidden">
                  <div
                    className="h-full transition-all duration-700"
                    style={{
                      width: `${v}%`,
                      background: 'linear-gradient(90deg, #4f9d63 0%, #2f7d3a 100%)',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Bento>
      </div>

      <Bento padding="lg" className="mb-8">
        <p className="vn-eyebrow mb-3">Harga pasar (Yahoo Finance · delayed)</p>
        <h3 className="vn-headline text-[22px] mb-5">Cek harga real-time.</h3>

        <div className="flex flex-wrap gap-2 mb-4">
          {EXAMPLES.map(s => (
            <button
              key={s}
              onClick={() => loadQuote(s)}
              className="text-[12px] px-3 py-1.5 rounded-full bg-[var(--vn-bg-deep)] hover:bg-[var(--vn-cream)] transition-colors"
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 mb-3">
          <input
            value={symbol}
            onChange={e => setSymbol(e.target.value.toUpperCase())}
            placeholder="Simbol: BBCA.JK, AAPL"
            className="vn-input"
          />
          <button onClick={() => loadQuote(symbol)} className="vn-btn vn-btn-primary !py-2.5">
            Cek
          </button>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <input
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            placeholder="Cari nama saham…"
            className="vn-input"
          />
          <button onClick={doSearch} className="vn-btn vn-btn-secondary !py-2.5">
            Cari
          </button>
        </div>

        {searchResults.length > 0 && (
          <ul className="text-[13px] space-y-1 mb-4">
            {searchResults.map(r => (
              <li key={r.symbol}>
                <button
                  className="text-[var(--vn-forest)] hover:underline"
                  onClick={() => loadQuote(r.symbol)}
                >
                  {r.symbol}
                </button>
                {' — '}
                {r.shortName}
              </li>
            ))}
          </ul>
        )}

        {quote && !quote.error && (
          <div className="flex flex-wrap items-center gap-6 p-5 rounded-2xl bg-[var(--vn-bg-soft)] border border-[var(--vn-line)]">
            <div>
              <p className="vn-headline text-[20px]">{quote.shortName}</p>
              <p className="text-[var(--vn-muted)] font-mono text-[12px]">{quote.symbol}</p>
            </div>
            <div>
              <p className="vn-display text-[28px] text-[var(--vn-forest-dark)]">
                {fmt(quote.regularMarketPrice ?? 0, quote.currency)}
              </p>
              <p
                className={`text-[13px] font-semibold ${
                  quote.regularMarketChangePercent && quote.regularMarketChangePercent >= 0
                    ? 'text-[var(--vn-forest)]'
                    : 'text-[var(--vn-red)]'
                }`}
              >
                {quote.regularMarketChangePercent?.toFixed(2)}%
              </p>
            </div>
            <Sparkline points={history} />
          </div>
        )}
        {quote?.error && <p className="text-[var(--vn-red)] text-[13px]">{quote.error}</p>}
      </Bento>

      <Bento padding="lg">
        <p className="vn-eyebrow mb-3">Portofolio simulasi</p>
        <h3 className="vn-headline text-[22px] mb-2">Belajar dengan harga sungguhan, tanpa uang sungguhan.</h3>
        <p className="text-[13px] text-[var(--vn-muted)] mb-5">
          Disimpan di browser kamu. Tidak ada transaksi nyata.
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          <input
            value={newSym}
            onChange={e => setNewSym(e.target.value.toUpperCase())}
            placeholder="Simbol"
            className="vn-input !w-32"
          />
          <input
            type="number"
            value={newShares}
            onChange={e => setNewShares(Number(e.target.value))}
            className="vn-input !w-28"
          />
          <button
            onClick={() => {
              if (!newSym) return
              setHoldings(h => [...h.filter(x => x.symbol !== newSym), { symbol: newSym, shares: newShares }])
            }}
            className="vn-btn vn-btn-primary !py-2.5"
          >
            Tambah
          </button>
        </div>

        {holdings.length > 0 ? (
          <>
            <ul className="space-y-2 mb-4">
              {holdings.map(h => {
                const q = portfolioQuotes[h.symbol]
                const val = (q?.regularMarketPrice ?? 0) * h.shares
                return (
                  <li
                    key={h.symbol}
                    className="flex justify-between items-center bg-[var(--vn-bg-deep)] rounded-2xl px-4 py-3 text-[14px]"
                  >
                    <span>
                      <strong>{h.symbol}</strong> × {h.shares}
                    </span>
                    <span className="text-[var(--vn-forest-dark)] font-semibold">
                      {fmt(val, q?.currency)}
                    </span>
                    <button
                      className="text-[var(--vn-red)] text-[12px]"
                      onClick={() => setHoldings(x => x.filter(i => i.symbol !== h.symbol))}
                    >
                      Hapus
                    </button>
                  </li>
                )
              })}
            </ul>
            <p className="vn-headline text-[18px] text-[var(--vn-forest-dark)]">
              Total simulasi: {fmt(portfolioValue, 'IDR')}
            </p>
          </>
        ) : (
          <p className="text-[13px] text-[var(--vn-muted)]">
            Belum ada holding. Tambah simbol di atas untuk mulai simulasi.
          </p>
        )}
      </Bento>
    </PageShell>
  )
}
