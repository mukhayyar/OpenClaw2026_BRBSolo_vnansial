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
import { pinHeader, getPin } from '../lib/auth'

const API = import.meta.env.VITE_API_URL || ''

const SUGGESTIONS = [
  'Hitung skor kesehatan finansial saya',
  'Cek apakah Binomo legal di OJK?',
  'Cicilan pinjaman 5 juta, bunga 24%, 12 bulan',
  'Cek rekening 1234567890 BCA',
  'Tampilkan grafik harga BBCA 3 bulan',
]

const INITIAL: ChatMessage = {
  role: 'assistant',
  content:
    'Halo! Pilih agent di atas, lalu tanya apa pun. Saya bisa cek izin OJK, hitung pinjaman, akses portofolio, scan rekening/nomor penipu, dan tampilkan grafik.',
}

type AgentOption = { id: string; name: string; description: string; kind: 'preset' | 'custom' }

export default function AsistenAI() {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [toolCalls, setToolCalls] = useState<ToolLog[]>([])
  const [apiOk, setApiOk] = useState<boolean | null>(null)
  const [agents, setAgents] = useState<AgentOption[]>([])
  const [agentId, setAgentId] = useState<string>('generalis')
  const [sessions, setSessions] = useState<{ id: number; title: string; agent_id: string }[]>([])
  const [sessionId, setSessionId] = useState<number | null>(null)

  useEffect(() => {
    checkApiHealth().then(setApiOk)
    fetch(`${API}/api/agents`, { headers: pinHeader() })
      .then(r => r.json())
      .then(d => {
        const a = [...(d.presets || []), ...(d.custom || [])]
        setAgents(a)
      })
    if (getPin()) {
      fetch(`${API}/api/sessions`, { headers: pinHeader() })
        .then(r => r.json())
        .then(d => setSessions(d.sessions || []))
    }
  }, [])

  async function send(text?: string) {
    const content = (text ?? input).trim()
    if (!content || loading) return
    const next: ChatMessage[] = [...messages, { role: 'user', content }]
    setMessages(next)
    setInput('')
    setLoading(true)
    setToolCalls([])
    try {
      const data = await sendAgentChat(next, { agentId, sessionId: sessionId || undefined })
      setMessages([...next, { role: 'assistant', content: data.message }])
      if (data.toolCalls?.length) {
        setToolCalls(data.toolCalls)
        emitToolToasts(data.toolCalls)
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Terjadi kesalahan'
      setMessages([...next, { role: 'assistant', content: `Maaf, asisten sedang sibuk (${msg}).` }])
    } finally {
      setLoading(false)
    }
  }

  async function newSession() {
    if (!getPin()) return alert('PIN dulu untuk simpan sesi.')
    const res = await fetch(`${API}/api/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...pinHeader() },
      body: JSON.stringify({ title: `Sesi ${new Date().toLocaleString('id-ID')}`, agentId }),
    })
    const s = await res.json()
    setSessions(prev => [s, ...prev])
    setSessionId(s.id)
    setMessages([INITIAL])
  }

  async function loadSession(id: number) {
    const res = await fetch(`${API}/api/sessions/${id}/messages`, { headers: pinHeader() })
    const data = await res.json()
    if (data.error) return
    setSessionId(id)
    setAgentId(data.session?.agent_id || 'generalis')
    const msgs: ChatMessage[] = data.messages.map((m: any) => ({ role: m.role, content: m.content }))
    setMessages(msgs.length ? msgs : [INITIAL])
  }

  function exportMd() {
    if (!sessionId) return
    window.open(`${API}/api/sessions/${sessionId}/export?pin=${encodeURIComponent(getPin())}`, '_blank')
  }

  return (
    <div className="bg-[var(--vn-bg-soft)] min-h-[calc(100vh-4rem)]">
      <div className="vn-container py-12 sm:py-16 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <p className="vn-eyebrow mb-3">Asisten · Multi-agent</p>
          <h1 className="vn-display text-[40px] sm:text-[56px] mb-3">
            Tanya santai, jawaban <span className="vn-text-gradient">jujur.</span>
          </h1>
          <p className="text-[17px] text-[var(--vn-ink-soft)] mb-6 leading-relaxed">
            Pilih agent sesuai kebutuhan. Setiap percakapan bisa disimpan sebagai sesi (butuh PIN).
          </p>
          {apiOk === false && (
            <p className="mb-4 text-[14px] text-[var(--vn-amber)]">
              Server belum tersambung. Jalankan <code className="bg-[var(--vn-amber-soft)] px-1.5 py-0.5 rounded">npm run dev</code>.
            </p>
          )}
        </motion.div>

        <div className="bento bento-pad mb-4 flex flex-wrap items-center gap-3 bg-white">
          <label className="flex-1 min-w-[220px]">
            <p className="vn-eyebrow mb-1.5">Agent</p>
            <select value={agentId} onChange={e => setAgentId(e.target.value)} className="vn-input">
              {agents.map(a => (
                <option key={a.id} value={a.id}>
                  {a.kind === 'custom' ? '★ ' : ''}{a.name} — {a.description}
                </option>
              ))}
            </select>
          </label>
          <label className="flex-1 min-w-[220px]">
            <p className="vn-eyebrow mb-1.5">Sesi {sessionId ? `#${sessionId}` : '(belum disimpan)'}</p>
            <select
              value={sessionId || ''}
              onChange={e => {
                const v = Number(e.target.value)
                if (v) loadSession(v)
              }}
              className="vn-input"
            >
              <option value="">— Pilih sesi —</option>
              {sessions.map(s => (
                <option key={s.id} value={s.id}>
                  #{s.id} · {s.title}
                </option>
              ))}
            </select>
          </label>
          <div className="flex gap-2 self-end pb-1">
            <button onClick={newSession} className="vn-btn vn-btn-secondary !py-2 !px-4 text-[13px]">+ Sesi</button>
            <button onClick={exportMd} disabled={!sessionId} className="vn-btn vn-btn-ghost !py-2 !px-4 text-[13px] disabled:opacity-40">
              Export .md
            </button>
          </div>
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

        <p className="mt-5 text-[12px] text-[var(--vn-muted)] text-center">
          Bukan nasihat keuangan berlisensi. Verifikasi di ojk.go.id sebelum berinvestasi.
        </p>
      </div>
    </div>
  )
}
