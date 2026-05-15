import { useEffect, useState } from 'react'

type Toast = { id: number; name: string }

const TOOL_LABELS: Record<string, string> = {
  check_investment_company: 'Cek izin OJK',
  calculate_loan: 'Hitung pinjaman',
  assess_investment_red_flags: 'Nilai red flag',
  get_fraud_report_guide: 'Panduan lapor',
  get_market_quote: 'Ambil harga pasar',
  search_market_symbols: 'Cari simbol pasar',
  calculate_investment_goal: 'Simulasi tabungan',
  suggest_asset_allocation: 'Saran alokasi aset',
  score_financial_health: 'Skor kesehatan finansial',
}

export default function ToolToastStack() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    const handler = (e: Event) => {
      const name = (e as CustomEvent<{ name: string }>).detail?.name
      if (!name) return
      const id = Date.now() + Math.random()
      setToasts(t => [...t.slice(-4), { id, name }])
      setTimeout(() => {
        setToasts(t => t.filter(x => x.id !== id))
      }, 4200)
    }
    window.addEventListener('vn-tool', handler)
    return () => window.removeEventListener('vn-tool', handler)
  }, [])

  if (!toasts.length) return null

  return (
    <div className="fixed top-20 right-4 z-[100] flex flex-col gap-2 max-w-xs pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className="vn-toast bg-white border border-[var(--vn-line)] rounded-2xl px-4 py-3 pointer-events-auto"
          style={{ boxShadow: 'var(--vn-shadow-md)' }}
        >
          <div className="flex items-center gap-2 text-[11px] text-[var(--vn-sage)] font-semibold mb-0.5">
            <span className="vn-dot vn-pulse" />
            ASISTEN BERAKSI
          </div>
          <p className="text-[13px] text-[var(--vn-ink-soft)]">
            {TOOL_LABELS[t.name] || t.name}
          </p>
        </div>
      ))}
    </div>
  )
}
