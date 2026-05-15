import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import PageShell from '../components/PageShell'
import Bento from '../components/Bento'
import TradingChart from './../components/TradingChart'

const API = import.meta.env.VITE_API_URL || ''

const COMMODITIES = [
  { id: 'CL=F', name: 'Crude Oil WTI', unit: 'USD / barrel', tone: 'ink' as const },
  { id: 'BZ=F', name: 'Brent Oil', unit: 'USD / barrel', tone: 'ink' as const },
  { id: 'NG=F', name: 'Natural Gas', unit: 'USD / MMBtu' },
  { id: 'GC=F', name: 'Gold', unit: 'USD / troy oz', tone: 'cream' as const },
  { id: 'SI=F', name: 'Silver', unit: 'USD / troy oz', tone: 'cream' as const },
  { id: 'PL=F', name: 'Platinum', unit: 'USD / troy oz' },
  { id: 'PA=F', name: 'Palladium', unit: 'USD / troy oz' },
  { id: 'HG=F', name: 'Copper', unit: 'USD / lb', tone: 'mint' as const },
  { id: 'ZC=F', name: 'Corn', unit: 'USD / bushel' },
  { id: 'ZS=F', name: 'Soybeans', unit: 'USD / bushel' },
  { id: 'KC=F', name: 'Coffee', unit: 'USD / lb' },
  { id: 'SB=F', name: 'Sugar', unit: 'USD / lb' },
]

type Quote = {
  symbol: string
  shortName?: string
  regularMarketPrice?: number
  regularMarketChangePercent?: number
  currency?: string
  error?: string
}

export default function Komoditas() {
  const [quotes, setQuotes] = useState<Record<string, Quote>>({})
  const [focused, setFocused] = useState(COMMODITIES[0].id)

  useEffect(() => {
    COMMODITIES.forEach(async c => {
      try {
        const res = await fetch(`${API}/api/market/quote?symbol=${encodeURIComponent(c.id)}`)
        const data = await res.json()
        setQuotes(q => ({ ...q, [c.id]: data }))
      } catch {}
    })
  }, [])

  return (
    <PageShell
      eyebrow="Watchlist · Komoditas"
      title="Pantau bahan baku global."
      subtitle="Minyak, logam mulia, gas, dan komoditas pertanian — semua di satu peta. Data Yahoo Finance, delayed. Buat hubungan ke portofolio saham kamu (energi, tambang, agribisnis) dari sini."
    >
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
        {COMMODITIES.map((c, i) => {
          const q = quotes[c.id]
          const up = (q?.regularMarketChangePercent ?? 0) >= 0
          const isFocused = focused === c.id
          return (
            <motion.button
              key={c.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => setFocused(c.id)}
              className={`bento bento-pad text-left ${c.tone === 'ink' ? 'bento-ink' : c.tone === 'cream' ? 'bento-cream' : c.tone === 'mint' ? 'bento-mint' : ''} ${
                isFocused ? '!ring-2 !ring-[var(--vn-forest)]' : ''
              }`}
            >
              <p className={`vn-eyebrow mb-2 ${c.tone === 'ink' ? '!text-[var(--vn-mint)]' : ''}`}>
                {c.id}
              </p>
              <p className={`vn-headline text-[18px] ${c.tone === 'ink' ? 'text-white' : ''}`}>
                {c.name}
              </p>
              <p className={`text-[12px] ${c.tone === 'ink' ? 'text-white/60' : 'text-[var(--vn-muted)]'}`}>
                {c.unit}
              </p>
              {q && !q.error && (
                <div className={`mt-3 ${c.tone === 'ink' ? 'text-white' : ''}`}>
                  <p className="vn-display text-[24px]">
                    {q.regularMarketPrice?.toFixed(2)}
                  </p>
                  <p className={`text-[12px] font-mono ${up ? 'text-[var(--vn-forest)]' : 'text-[var(--vn-red)]'} ${c.tone === 'ink' && up ? '!text-[var(--vn-mint)]' : ''}`}>
                    {up ? '↑' : '↓'} {q.regularMarketChangePercent?.toFixed(2)}%
                  </p>
                </div>
              )}
              {q?.error && (
                <p className={`text-[12px] mt-2 ${c.tone === 'ink' ? 'text-white/60' : 'text-[var(--vn-muted)]'}`}>
                  data tidak tersedia
                </p>
              )}
            </motion.button>
          )
        })}
      </div>

      <Bento padding="lg">
        <p className="vn-eyebrow mb-3">Grafik {focused}</p>
        <h3 className="vn-headline text-[22px] mb-4">{COMMODITIES.find(c => c.id === focused)?.name}</h3>
        <TradingChart kind="saham" symbol={focused} range="3mo" height={240} />
        <p className="mt-4 text-[12px] text-[var(--vn-muted)] leading-relaxed">
          Komoditas Indonesia banyak terhubung ke saham IDX: emiten energi (ADRO, AADI, MEDC) bergerak
          dengan minyak; tambang (ANTM, INCO, AMMN) dengan nikel & logam; perkebunan (LSIP, AALI) dengan
          CPO. Buka /emiten untuk profilnya, lalu /asisten untuk minta analisis korelasi.
        </p>
      </Bento>
    </PageShell>
  )
}
