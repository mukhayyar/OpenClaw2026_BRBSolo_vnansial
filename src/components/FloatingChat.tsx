import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import ChatUI from './ChatUI'
import {
  type ChatMessage,
  type ToolLog,
  sendAgentChat,
  emitToolToasts,
} from '../lib/chatApi'

const MINI_SUGGESTIONS = [
  'Cek skor kesehatan finansial saya',
  'Apakah Binomo legal di OJK?',
]

const INITIAL: ChatMessage = {
  role: 'assistant',
  content: 'Halo! Saya Asisten Vnansial. Tanya cek investasi, hitung pinjaman, atau skor kesehatan finansial kamu.',
}

export default function FloatingChat() {
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [toolCalls, setToolCalls] = useState<ToolLog[]>([])

  const onAsistenPage = location.pathname === '/asisten'

  useEffect(() => {
    if (onAsistenPage) setOpen(false)
  }, [onAsistenPage])

  async function send(text?: string) {
    const content = (text ?? input).trim()
    if (!content || loading) return
    const next = [...messages, { role: 'user' as const, content }]
    setMessages(next)
    setInput('')
    setLoading(true)
    setToolCalls([])
    try {
      const data = await sendAgentChat(next)
      setMessages([...next, { role: 'assistant', content: data.message }])
      if (data.toolCalls?.length) {
        setToolCalls(data.toolCalls)
        emitToolToasts(data.toolCalls)
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error'
      setMessages([
        ...next,
        {
          role: 'assistant',
          content: `Maaf, ${msg}. Coba lagi sebentar.`,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  if (onAsistenPage) return null

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
            className="fixed bottom-24 right-4 z-[70] w-[min(400px,calc(100vw-2rem))]"
          >
            <div style={{ boxShadow: 'var(--vn-shadow-lg)', borderRadius: 28 }}>
              <ChatUI
                compact
                messages={messages}
                loading={loading}
                toolCalls={toolCalls}
                input={input}
                onInputChange={setInput}
                onSend={send}
                suggestions={MINI_SUGGESTIONS}
              />
            </div>
            <Link
              to="/asisten"
              className="block text-center text-[12px] text-[var(--vn-forest)] mt-2 hover:underline"
            >
              Buka chat penuh →
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label="Buka Asisten"
        className="fixed bottom-6 right-4 z-[70] w-14 h-14 rounded-full flex items-center justify-center text-white"
        style={{
          background: 'linear-gradient(140deg, #2f7d3a 0%, #4f9d63 100%)',
          boxShadow: '0 18px 36px -10px rgba(47, 125, 58, 0.55)',
        }}
      >
        {open ? (
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <line x1="6" y1="6" x2="18" y2="18" />
            <line x1="6" y1="18" x2="18" y2="6" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        )}
      </button>
    </>
  )
}
