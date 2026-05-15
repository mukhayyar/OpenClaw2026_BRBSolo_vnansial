import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import ChatUI from '../components/ChatUI'
import {
  type ChatMessage,
  type ToolLog,
  sendAgentChat,
  emitToolToasts,
  checkApiHealth,
} from '../lib/chatApi'

const SUGGESTIONS = [
  'Cek apakah Binomo legal di OJK?',
  'Hitung cicilan pinjaman 5 juta, bunga 24%, 12 bulan',
  'Apa red flag investasi bodong?',
  'Jadwalkan posting tips literasi keuangan besok',
]

const INITIAL: ChatMessage = {
  role: 'assistant',
  content:
    'Halo! Saya Asisten Vnansial — agen AI dengan tool calling. Tanya investasi, pinjaman, penipuan, atau Repliz.',
}

export default function AsistenAI() {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [toolCalls, setToolCalls] = useState<ToolLog[]>([])
  const [apiOk, setApiOk] = useState<boolean | null>(null)

  useEffect(() => {
    checkApiHealth().then(setApiOk)
  }, [])

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
      const msg = e instanceof Error ? e.message : 'Terjadi kesalahan'
      setMessages([
        ...next,
        {
          role: 'assistant',
          content: `⚠️ ${msg}. Jalankan \`npm run dev\` dan isi SUMOPOD_API_KEY di .env.`,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto px-4 py-10"
    >
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-300 via-cyan-300 to-emerald-300 bg-clip-text text-transparent">
            Asisten AI
          </h1>
          <span className="badge-onchain">Multi-Tool Agent</span>
        </div>
        <p className="text-slate-400 text-sm">
          Powered by SumoPod · Autonomous tool loop · Repliz (opsional)
        </p>
        {apiOk === false && (
          <p className="mt-2 text-amber-400 text-sm">
            API offline — jalankan <code className="text-amber-200">npm run dev</code>
          </p>
        )}
        {apiOk === true && (
          <p className="mt-2 text-emerald-400 text-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 status-pulse" />
            Agent online
          </p>
        )}
      </div>

      <ChatUI
        messages={messages}
        loading={loading}
        toolCalls={toolCalls}
        input={input}
        onInputChange={setInput}
        onSend={send}
        suggestions={SUGGESTIONS}
      />

      <p className="mt-4 text-xs text-slate-500 text-center">
        Bukan nasihat keuangan berlisensi. Verifikasi di ojk.go.id sebelum investasi.
      </p>
    </motion.div>
  )
}
