import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import type { ChatMessage, ToolLog } from '../lib/chatApi'

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
        compact ? 'min-h-[320px] max-h-[min(420px,65vh)]' : 'min-h-[480px] max-h-[72vh]'
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
              {loading ? 'Sedang berpikir…' : 'Siap membantu'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-white">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`max-w-[85%] px-4 py-2.5 text-[14.5px] leading-relaxed whitespace-pre-wrap ${
                m.role === 'user' ? 'vn-bubble-user' : 'vn-bubble-agent'
              }`}
            >
              {m.content}
            </motion.div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="vn-bubble-agent px-4 py-3 vn-typing">
              <span /><span /><span />
            </div>
          </div>
        )}

        {toolCalls.length > 0 && (
          <div className="mt-3 space-y-2">
            <p className="vn-eyebrow">Aktivitas asisten</p>
            {toolCalls.map((t, i) => (
              <div
                key={i}
                className="rounded-2xl bg-[var(--vn-bg-deep)] px-3.5 py-2.5 text-[12px]"
              >
                <p className="font-mono text-[var(--vn-forest-dark)] font-semibold">
                  {i + 1}. {t.name}
                </p>
                <pre className="mt-0.5 text-[var(--vn-muted)] overflow-x-auto whitespace-pre-wrap text-[11px] max-h-12">
                  {JSON.stringify(t.result).slice(0, 140)}…
                </pre>
              </div>
            ))}
          </div>
        )}
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
          placeholder="Tanya apa pun soal keuangan…"
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
