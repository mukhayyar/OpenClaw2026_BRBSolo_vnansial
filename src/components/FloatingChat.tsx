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
  'Cek Binomo di OJK?',
  'Hitung pinjaman 5jt',
]

const INITIAL: ChatMessage = {
  role: 'assistant',
  content: 'Halo! Tanya singkat soal investasi, pinjaman, atau penipuan.',
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
          content: `⚠️ ${msg}. Jalankan npm run dev dan isi SUMOPOD_API_KEY.`,
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
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            className="fixed bottom-24 right-4 z-[70] w-[min(400px,calc(100vw-2rem))]"
          >
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
            <Link
              to="/asisten"
              className="block text-center text-xs text-cyan-400 mt-2 hover:underline"
            >
              Buka chat penuh →
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-4 z-[70] w-14 h-14 rounded-2xl btn-neon flex items-center justify-center text-2xl shadow-lg animate-float"
        aria-label="Buka AI Chat"
      >
        {open ? '✕' : '🤖'}
      </button>
    </>
  )
}
