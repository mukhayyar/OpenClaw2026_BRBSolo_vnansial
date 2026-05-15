import { useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { ChatMessage, ToolLog } from '../lib/chatApi'
import TradingChart from './TradingChart'
import TechnicalChart from './TechnicalChart'
import { renderMarkdown } from '../lib/markdown'

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
  get_idx_company: 'Profil emiten IDX',
  get_idx_dividen: 'Dividen IDX',
  get_idx_financial: 'Laporan keuangan IDX',
  list_idx_emiten: 'Daftar emiten',
  get_crypto_quote: 'Kutipan crypto',
  assess_crypto_scam_risk: 'Risk score crypto',
  list_insurance_companies: 'Daftar asuransi',
  calculate_insurance_premium: 'Hitung premi',
  recommend_insurance: 'Rekomendasi asuransi',
  get_user_portfolio: 'Baca portofolio',
  add_portfolio_holding: 'Tambah holding',
  remove_portfolio_holding: 'Hapus holding',
  update_money_buffer: 'Update buffer',
  save_health_score: 'Simpan skor sehat',
  list_health_history: 'History skor',
  check_bank_account_report: 'Cek rekening (Kominfo)',
  check_phone_number_report: 'Cek nomor HP (BRTI)',
  render_chart: 'Render grafik',
  create_price_alert: 'Buat alert',
  list_price_alerts: 'Daftar alert',
  delete_price_alert: 'Hapus alert',
  ask_other_agent: 'Delegasi ke agent lain',
  search_dex_token: 'Cari DEX token',
  assess_dex_token: 'Risk score DEX',
}

type Props = {
  messages: ChatMessage[]
  loading: boolean
  toolCalls: ToolLog[]
  input: string
  onInputChange: (v: string) => void
  onSend: (text?: string) => void
  suggestions?: string[]
  compact?: boolean
}

/**
 * Parse `[[chart:kind:symbol:range]]` and `[[ta:kind:symbol:range:indicators]]`
 * markers in assistant content. Returns alternating text + chart fragments.
 */
function splitChartMarkers(content: string) {
  const re = /\[\[(chart|ta):(saham|crypto):([A-Za-z0-9._-]+):(1mo|3mo|6mo|1y)(?::([a-z,]+))?\]\]/g
  const parts: Array<
    | { type: 'text'; value: string }
    | { type: 'chart'; kind: 'saham' | 'crypto'; symbol: string; range: string }
    | { type: 'ta'; kind: 'saham' | 'crypto'; symbol: string; range: string; indicators: string }
  > = []
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(content)) !== null) {
    if (m.index > last) parts.push({ type: 'text', value: content.slice(last, m.index) })
    const markerType = m[1]
    if (markerType === 'ta') {
      parts.push({
        type: 'ta',
        kind: m[2] as 'saham' | 'crypto',
        symbol: m[3],
        range: m[4] as '1mo' | '3mo' | '6mo' | '1y',
        indicators: m[5] || 'ma,bollinger',
      })
    } else {
      parts.push({
        type: 'chart',
        kind: m[2] as 'saham' | 'crypto',
        symbol: m[3],
        range: (m[4] as '1mo' | '3mo' | '6mo' | '1y') || '3mo',
      })
    }
    last = m.index + m[0].length
  }
  if (last < content.length) parts.push({ type: 'text', value: content.slice(last) })
  return parts
}

function ToolTimeline({ toolCalls }: { toolCalls: ToolLog[] }) {
  if (!toolCalls.length) return null
  return (
    <div className="space-y-1.5 py-1">
      {toolCalls.map((t, i) => {
        const label = TOOL_LABELS[t.name] || t.name
        const isErr = (t.result as any)?.error
        return (
          <motion.div
            key={`${t.name}-${i}`}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className="flex items-center gap-2.5"
          >
            <span
              aria-hidden
              className={`w-5 h-5 rounded-full grid place-items-center text-[10px] font-bold ${
                isErr ? 'bg-[var(--vn-red-soft)] text-[var(--vn-red)]' : 'bg-[var(--vn-cream)] text-[var(--vn-forest-dark)]'
              }`}
            >
              {i + 1}
            </span>
            <span className="font-mono text-[11px] text-[var(--vn-forest-dark)] font-semibold">
              {t.name}
            </span>
            <span className="text-[12px] text-[var(--vn-ink-soft)]">{label}</span>
            {isErr && <span className="text-[10px] text-[var(--vn-red)] uppercase tracking-wider">{(t.result as any).error}</span>}
          </motion.div>
        )
      })}
    </div>
  )
}

export default function ChatUI({
  messages,
  loading,
  toolCalls,
  input,
  onInputChange,
  onSend,
  suggestions = [],
  compact = false,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading, toolCalls])

  return (
    <div
      className={`bento bg-white border border-[var(--vn-line)] !rounded-[28px] overflow-hidden flex flex-col ${
        compact ? 'min-h-[320px] max-h-[min(420px,65vh)]' : 'min-h-[480px] max-h-[78vh]'
      }`}
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--vn-line)] bg-[var(--vn-bg-soft)]">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: 'linear-gradient(140deg, #2f7d3a 0%, #86c294 100%)' }}
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 21c-4-3-7-6-7-11a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 5-3 8-7 11Z" />
            </svg>
          </span>
          <div>
            <p className="vn-headline text-[15px]">Asisten Vnansial</p>
            <p className="text-[11px] text-[var(--vn-muted)] flex items-center gap-1.5">
              <span className="vn-dot vn-pulse" />
              {loading ? 'Berpikir & memanggil tool…' : 'Siap membantu'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-white">
        {messages.map((m, i) => {
          const isLastAssistant = i === messages.length - 1 && m.role === 'assistant'
          return (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`max-w-[88%] ${m.role === 'user' ? 'vn-bubble-user' : 'vn-bubble-agent'} px-4 py-2.5`}
              >
                {m.role === 'assistant' ? (
                  <AssistantContent content={m.content} />
                ) : (
                  <span className="text-[14.5px] leading-relaxed whitespace-pre-wrap">{m.content}</span>
                )}
                {/* Surface the tool log right under the last assistant turn */}
                {isLastAssistant && toolCalls.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[var(--vn-line)]">
                    <p className="vn-eyebrow mb-2 text-[10px]">Tool yang dipanggil ({toolCalls.length})</p>
                    <ToolTimeline toolCalls={toolCalls} />
                  </div>
                )}
              </motion.div>
            </div>
          )
        })}

        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex justify-start"
            >
              <div className="vn-bubble-agent px-4 py-3 vn-typing">
                <span /><span /><span />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={bottomRef} />
      </div>

      {suggestions.length > 0 && (
        <div className="border-t border-[var(--vn-line)] p-3 flex flex-wrap gap-1.5 bg-white">
          {suggestions.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => onSend(s)}
              disabled={loading}
              className="text-[12px] px-3 py-1.5 rounded-full bg-[var(--vn-bg-deep)] hover:bg-[var(--vn-cream)] text-[var(--vn-ink-soft)] disabled:opacity-50 transition-colors"
            >
              {s.slice(0, compact ? 32 : 48)}
              {s.length > (compact ? 32 : 48) ? '…' : ''}
            </button>
          ))}
        </div>
      )}

      <form
        className="border-t border-[var(--vn-line)] p-3 flex gap-2 bg-white"
        onSubmit={e => {
          e.preventDefault()
          onSend()
        }}
      >
        <input
          value={input}
          onChange={e => onInputChange(e.target.value)}
          placeholder="Tanya apa pun. Contoh: tampilkan grafik BBCA 3 bulan…"
          disabled={loading}
          className="vn-input flex-1"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="vn-btn vn-btn-primary !py-2.5 !px-5 text-[14px] disabled:opacity-50"
        >
          Kirim
        </button>
      </form>
    </div>
  )
}

function AssistantContent({ content }: { content: string }) {
  const parts = useMemo(() => splitChartMarkers(content), [content])
  return (
    <div className="space-y-3">
      {parts.map((p, i) => {
        if (p.type === 'text') return <div key={i}>{renderMarkdown(p.value)}</div>
        if (p.type === 'ta') {
          return (
            <div key={i} className="not-prose">
              <TechnicalChart kind={p.kind} symbol={p.symbol} range={p.range} height={260} />
            </div>
          )
        }
        return (
          <div key={i} className="not-prose">
            <TradingChart kind={p.kind} symbol={p.symbol} range={p.range as any} height={180} showAxis={false} />
          </div>
        )
      })}
    </div>
  )
}
