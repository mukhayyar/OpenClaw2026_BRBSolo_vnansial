import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { renderMarkdown } from '../lib/markdown'
import { sendAgentChat } from '../lib/chatApi'

const API = import.meta.env.VITE_API_URL || ''

type Props = {
  open: boolean
  kind: 'saham' | 'crypto' | 'komoditas'
  symbol: string
  name?: string
  onClose: () => void
}

type WhitepaperRow = {
  id: string
  name?: string
  url: string
  summary?: string
}

export default function AnalysisModal({ open, kind, symbol, name, onClose }: Props) {
  const [analysis, setAnalysis] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [whitepaper, setWhitepaper] = useState<WhitepaperRow | null>(null)

  useEffect(() => {
    if (!open) return
    setAnalysis('')
    setLoading(true)
    setWhitepaper(null)

    // Fetch whitepaper in parallel
    fetch(`${API}/api/whitepaper/${encodeURIComponent(symbol)}`)
      .then(r => r.json())
      .then(d => {
        if (d && d.url) setWhitepaper(d)
      })
      .catch(() => {})

    // Ask the agent for a structured analysis
    const prompt =
      `Analisis lengkap ${kind} *${symbol}* (${name || symbol}). ` +
      `Pakai tool analyze_asset untuk framework, lalu tool data (get_idx_company / get_crypto_quote / get_market_quote) ` +
      `untuk angka konkret. Format markdown dengan headings: "## Faktor Makro", "## Faktor Mikro", ` +
      `"## Sentimen Pasar", "## Risiko Utama", "## Outlook 6-12 Bulan". Singkat tapi padat, total 250-400 kata. ` +
      `Tutup dengan disclaimer.`

    sendAgentChat([{ role: 'user', content: prompt }])
      .then(r => setAnalysis(r.message || '_(jawaban kosong)_'))
      .catch(e => setAnalysis(`_Gagal memuat analisis: ${e instanceof Error ? e.message : 'error'}_`))
      .finally(() => setLoading(false))
  }, [open, kind, symbol, name])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[var(--vn-ink)]/50 backdrop-blur-sm z-[95]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
            className="fixed inset-0 z-[96] flex items-start justify-center px-4 py-12 overflow-y-auto"
          >
            <div className="bento bento-pad-lg bg-white w-full max-w-3xl my-auto" style={{ boxShadow: 'var(--vn-shadow-lg)' }}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="vn-eyebrow mb-1">Analisis · {kind}</p>
                  <h2 className="vn-display text-[28px]">
                    {name || symbol}
                  </h2>
                  <p className="text-[12px] text-[var(--vn-muted)] font-mono mt-1">{symbol}</p>
                </div>
                <button
                  onClick={onClose}
                  aria-label="Tutup"
                  className="w-9 h-9 rounded-full bg-[var(--vn-bg-deep)] grid place-items-center"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                    <line x1="6" y1="6" x2="18" y2="18" />
                    <line x1="6" y1="18" x2="18" y2="6" />
                  </svg>
                </button>
              </div>

              {whitepaper && (
                <div className="mb-4 p-4 rounded-2xl bg-[var(--vn-cream)]">
                  <p className="vn-eyebrow mb-1">Fundamentals / whitepaper</p>
                  <a
                    href={whitepaper.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[14px] underline text-[var(--vn-forest-dark)]"
                  >
                    {whitepaper.name || whitepaper.url} ↗
                  </a>
                  {whitepaper.summary && (
                    <p className="mt-2 text-[12.5px] text-[var(--vn-ink-soft)] leading-relaxed">
                      {whitepaper.summary}
                    </p>
                  )}
                </div>
              )}

              {loading && (
                <div className="text-[14px] text-[var(--vn-muted)] flex items-center gap-2">
                  <span className="vn-dot vn-pulse" /> Asisten sedang menganalisis (memanggil tool data + makro/mikro)…
                </div>
              )}
              {!loading && analysis && (
                <div className="prose prose-sm max-w-none">{renderMarkdown(analysis)}</div>
              )}
              {!loading && !analysis && (
                <p className="text-[14px] text-[var(--vn-muted)]">Analisis belum tersedia.</p>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
