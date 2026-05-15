import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import PageShell from '../components/PageShell'
import Bento from '../components/Bento'
import TradingChart from '../components/TradingChart'

const API = import.meta.env.VITE_API_URL || ''

type Coin = {
  id: string
  symbol: string
  name: string
  price: number
  marketCap: number
  volume24h: number
  change24h: number
  change30d: number
  image: string
  rank: number
}

type RiskResult = {
  coin: any
  risk: { score: number; level: string; reasons: string[] }
}

function fmtUsd(n: number) {
  if (!Number.isFinite(n)) return '—'
  if (n >= 1) return `$${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
  return `$${n.toFixed(6)}`
}

function fmtCap(n: number) {
  if (!n) return '—'
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`
  return `$${(n / 1e3).toFixed(0)}K`
}

function riskTone(score: number) {
  if (score >= 70) return { bg: 'bg-[var(--vn-red-soft)]', text: 'text-[var(--vn-red)]', label: 'Risiko sangat tinggi' }
  if (score >= 50) return { bg: 'bg-[var(--vn-amber-soft)]', text: 'text-[#92400e]', label: 'Risiko tinggi' }
  if (score >= 30) return { bg: 'bg-[var(--vn-cream)]', text: 'text-[var(--vn-forest-dark)]', label: 'Risiko menengah' }
  return { bg: 'bg-[var(--vn-mint-soft)]', text: 'text-[var(--vn-forest-dark)]', label: 'Risiko rendah' }
}

export default function CryptoWatch() {
  const [coins, setCoins] = useState<Coin[]>([])
  const [selected, setSelected] = useState<string>('bitcoin')
  const [risk, setRisk] = useState<RiskResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [riskLoading, setRiskLoading] = useState(false)
  const [searchQ, setSearchQ] = useState('')
  const [searchResults, setSearchResults] = useState<{ id: string; symbol: string; name: string; image?: string }[]>([])

  useEffect(() => {
    fetch(`${API}/api/crypto/top?limit=50`)
      .then(r => r.json())
      .then(d => {
        setCoins(d.coins || [])
        setLoading(false)
      })
      .catch(() => {
        setCoins([])
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    const q = searchQ.trim()
    if (q.length < 2) {
      setSearchResults([])
      return
    }
    const t = setTimeout(() => {
      fetch(`${API}/api/crypto/search?q=${encodeURIComponent(q)}`)
        .then(r => r.json())
        .then(d => setSearchResults(d.results || []))
        .catch(() => setSearchResults([]))
    }, 250)
    return () => clearTimeout(t)
  }, [searchQ])

  useEffect(() => {
    if (!selected) return
    setRiskLoading(true)
    fetch(`${API}/api/crypto/risk?id=${encodeURIComponent(selected)}`)
      .then(r => r.json())
      .then(d => setRisk(d))
      .finally(() => setRiskLoading(false))
  }, [selected])

  const tone = risk && risk.coin && risk.risk?.score != null ? riskTone(risk.risk.score) : null

  return (
    <PageShell
      eyebrow="Crypto · Live market"
      title="Lihat pasar crypto, ukur risiko scam."
      subtitle="Harga publik dari CoinGecko + skor heuristik untuk mendeteksi koin baru, tipis likuiditas, atau koin yang pernah scam."
    >
      <div className="grid lg:grid-cols-5 gap-4 sm:gap-6">
        <Bento padding="lg" className="lg:col-span-3">
          <div className="flex items-baseline justify-between gap-4 mb-3">
            <p className="vn-eyebrow">Top 50 + cari coin apapun</p>
            {loading && <p className="text-[11px] text-[var(--vn-muted)]">Memuat…</p>}
          </div>
          <div className="relative mb-3">
            <input
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              placeholder="Cari koin (meme, low cap, apa pun): pepe, doge, …"
              className="vn-input"
            />
            {searchResults.length > 0 && (
              <ul className="absolute z-20 left-0 right-0 mt-1 max-h-72 overflow-y-auto bg-white border border-[var(--vn-line)] rounded-2xl shadow-lg">
                {searchResults.map(r => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelected(r.id)
                        setSearchQ('')
                        setSearchResults([])
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-[var(--vn-cream)] flex items-center gap-2 text-[13px]"
                    >
                      {r.image && <img src={r.image} alt="" className="w-5 h-5 rounded-full" />}
                      <span className="font-mono text-[12px] font-bold text-[var(--vn-forest-dark)]">{r.symbol}</span>
                      <span className="text-[var(--vn-muted)]">{r.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[460px] overflow-y-auto pr-1">
            {coins.map(c => (
              <button
                key={c.id}
                onClick={() => setSelected(c.id)}
                className={`text-left rounded-2xl px-3 py-2.5 flex items-center gap-2.5 transition-colors ${
                  selected === c.id
                    ? 'bg-[var(--vn-forest)] text-white'
                    : 'bg-[var(--vn-bg-deep)] hover:bg-[var(--vn-cream)]'
                }`}
              >
                {c.image && <img src={c.image} alt="" className="w-6 h-6 rounded-full" />}
                <div className="min-w-0">
                  <p className="font-mono text-[12px] font-bold">{c.symbol}</p>
                  <p className="text-[11px] opacity-80 truncate">{fmtUsd(c.price)}</p>
                </div>
              </button>
            ))}
          </div>
        </Bento>

        <Bento padding="lg" className="lg:col-span-2" tone={risk && risk.coin && risk.risk?.score >= 70 ? 'ink' : 'cream'}>
          {riskLoading && <p className="text-[var(--vn-muted)]">Menilai…</p>}
          {!riskLoading && risk && (risk as any).error && (
            <div className="text-[14px] text-[var(--vn-ink-soft)]">
              <p className="vn-eyebrow mb-2">Penilaian belum tersedia</p>
              <p className="leading-relaxed">
                CoinGecko sedang membatasi akses ({(risk as any).status || 'error'}).
                Coba lagi beberapa menit, atau pilih koin lain. Daftar harga di samping tetap aktif.
              </p>
              <p className="text-[12px] text-[var(--vn-muted)] mt-3">
                Tetap waspada: koin baru / kapitalisasi kecil / volume rendah selalu lebih berisiko.
              </p>
            </div>
          )}
          {!riskLoading && risk && risk.coin && !(risk as any).error && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} key={risk.coin.id}>
              <p className={`vn-eyebrow mb-2 ${risk.risk.score >= 70 ? '!text-[var(--vn-mint)]' : ''}`}>Risk score</p>
              <h2 className={`vn-display text-[40px] sm:text-[56px] mb-1 ${risk.risk.score >= 70 ? 'text-white' : 'text-[var(--vn-forest-dark)]'}`}>
                {risk.coin.name}
              </h2>
              <p className={`text-[14px] mb-4 ${risk.risk.score >= 70 ? 'text-white/70' : 'text-[var(--vn-muted)]'}`}>
                {risk.coin.symbol} · {fmtUsd(risk.coin.price)} · 30d {risk.coin.change30d?.toFixed?.(1)}%
              </p>

              <div className={`inline-flex items-baseline gap-3 px-4 py-3 rounded-2xl ${tone?.bg}`}>
                <span className={`vn-display text-[48px] ${tone?.text}`}>{risk.risk.score}</span>
                <span className={`text-[12px] uppercase tracking-wider font-bold ${tone?.text}`}>{tone?.label}</span>
              </div>

              <div className="mt-5">
                <TradingChart kind="crypto" symbol={risk.coin.id} height={180} showAxis={false} range="3mo" />
              </div>

              <p className={`vn-eyebrow mt-6 mb-2 ${risk.risk.score >= 70 ? '!text-[var(--vn-mint)]' : ''}`}>Alasan</p>
              <ul className={`space-y-1.5 text-[13.5px] leading-relaxed ${risk.risk.score >= 70 ? 'text-white/85' : 'text-[var(--vn-ink-soft)]'}`}>
                {risk.risk.reasons.map((r, i) => (
                  <li key={i} className="flex gap-2 items-start">
                    <span>·</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>

              <p className={`mt-5 text-[11px] ${risk.risk.score >= 70 ? 'text-white/55' : 'text-[var(--vn-muted)]'}`}>
                Skor heuristik berdasarkan data publik. Bukan audit smart contract. DYOR.
              </p>
            </motion.div>
          )}
        </Bento>
      </div>

      <Bento padding="lg" className="mt-6">
        <p className="vn-eyebrow mb-3">Tabel pasar</p>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="text-left text-[var(--vn-muted)] text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-2">#</th>
                <th className="py-2">Coin</th>
                <th className="py-2 text-right">Harga</th>
                <th className="py-2 text-right hidden sm:table-cell">Cap</th>
                <th className="py-2 text-right">24j</th>
                <th className="py-2 text-right hidden md:table-cell">30h</th>
              </tr>
            </thead>
            <tbody>
              {coins.map(c => (
                <tr key={c.id} className="border-t border-[var(--vn-line)]">
                  <td className="py-2.5 font-mono text-[12px]">{c.rank}</td>
                  <td className="py-2.5">
                    <button onClick={() => setSelected(c.id)} className="flex items-center gap-2 hover:text-[var(--vn-forest)]">
                      {c.image && <img src={c.image} alt="" className="w-5 h-5 rounded-full" />}
                      <span className="font-medium">{c.name}</span>
                      <span className="text-[var(--vn-muted)] font-mono">{c.symbol}</span>
                    </button>
                  </td>
                  <td className="py-2.5 text-right font-mono">{fmtUsd(c.price)}</td>
                  <td className="py-2.5 text-right font-mono hidden sm:table-cell">{fmtCap(c.marketCap)}</td>
                  <td
                    className={`py-2.5 text-right font-mono ${
                      c.change24h >= 0 ? 'text-[var(--vn-forest)]' : 'text-[var(--vn-red)]'
                    }`}
                  >
                    {c.change24h?.toFixed(2)}%
                  </td>
                  <td
                    className={`py-2.5 text-right font-mono hidden md:table-cell ${
                      c.change30d >= 0 ? 'text-[var(--vn-forest)]' : 'text-[var(--vn-red)]'
                    }`}
                  >
                    {c.change30d?.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Bento>
    </PageShell>
  )
}
