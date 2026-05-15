import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import type { ChatMessage, ToolLog } from '../lib/chatApi'

const AGENT_AVATAR = '🤖'

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
      className={`glass-strong rounded-2xl overflow-hidden flex flex-col glass-neon ${
        compact ? 'min-h-[320px] max-h-[min(420px,60vh)]' : 'min-h-[420px] max-h-[70vh]'
      }`}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/20">
        <div className="flex items-center gap-2">
          <span className="text-xl animate-float">{AGENT_AVATAR}</span>
          <div>
            <p className="text-sm font-bold text-white">Vnansial Agent</p>
            <p className="text-[10px] text-cyan-400 font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 status-pulse" />
              {loading ? 'Executing tools…' : 'Online · SumoPod'}
            </p>
          </div>
        </div>
        <span className="badge-onchain hidden sm:inline-flex">AI</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.role === 'assistant' && (
              <span className="text-lg shrink-0 mt-1">{AGENT_AVATAR}</span>
            )}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${
                m.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-agent'
              }`}
            >
              {m.content}
            </motion.div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-2 items-center text-slate-400 text-sm">
            <span>{AGENT_AVATAR}</span>
            <div className="chat-bubble-agent rounded-2xl px-4 py-3 typing-dots">
              <span /><span /><span />
            </div>
          </div>
        )}

        {toolCalls.length > 0 && (
          <div className="space-y-2 mt-2">
            <p className="text-[10px] uppercase tracking-wider text-cyan-500/80 font-mono">
              On-chain activity feed
            </p>
            {toolCalls.map((t, i) => (
              <div key={i} className="chain-block glass rounded-lg px-3 py-2 text-xs">
                <span className="text-cyan-400 font-mono">#{i + 1}</span>{' '}
                <span className="text-emerald-400 font-semibold">{t.name}</span>
                <pre className="mt-1 text-slate-500 overflow-x-auto max-h-16 text-[10px]">
                  {JSON.stringify(t.result, null, 0).slice(0, 120)}…
                </pre>
              </div>
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {suggestions.length > 0 && (
        <div className="border-t border-white/10 p-2 flex flex-wrap gap-1.5">
          {suggestions.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => onSend(s)}
              disabled={loading}
              className="text-[10px] px-2.5 py-1 rounded-full btn-glass disabled:opacity-50"
            >
              {s.slice(0, compact ? 28 : 40)}
              {s.length > (compact ? 28 : 40) ? '…' : ''}
            </button>
          ))}
        </div>
      )}

      <form
        className="border-t border-white/10 p-3 flex gap-2 bg-black/20"
        onSubmit={e => {
          e.preventDefault()
          onSend()
        }}
      >
        <input
          value={input}
          onChange={e => onInputChange(e.target.value)}
          placeholder="Tanya agen keuangan…"
          disabled={loading}
          className="flex-1 px-4 py-2.5 rounded-xl input-glass text-sm"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-4 py-2.5 rounded-xl btn-neon text-sm disabled:opacity-50"
        >
          Kirim
        </button>
      </form>
    </div>
  )
}
