import { useEffect, useState } from 'react'
import PageShell from '../components/PageShell'
import Bento from '../components/Bento'
import PinGate from '../components/PinGate'
import { pinHeader, getPin, clearPin } from '../lib/auth'

const API = import.meta.env.VITE_API_URL || ''

type Settings = {
  user_id: number
  telegram_chat_id: string | null
  default_agent_id: string
}

type SettingsResponse = {
  settings: Settings
  telegramConfigured: boolean
  telegramTokenMasked: string | null
  pinProtected: boolean
}

type AgentPreset = { id: string; name: string; description: string; kind: 'preset' | 'custom' }

export default function SettingsPage() {
  return (
    <PageShell
      eyebrow="Pengaturan"
      title="Atur AI, Telegram, dan agent-mu."
      subtitle="Token Telegram disamarkan. Ubah pengaturan butuh PIN. Buat agent kustom dengan prompt sendiri."
    >
      <PinGate
        title="Buka kunci Pengaturan"
        reason="Pengaturan menyentuh integrasi Telegram dan agent kustom — butuh PIN supaya tidak sembarang orang ubah."
      >
        <SettingsBody />
      </PinGate>
    </PageShell>
  )
}

function SettingsBody() {
  const [data, setData] = useState<SettingsResponse | null>(null)
  const [telegramChatId, setTelegramChatId] = useState('')
  const [defaultAgent, setDefaultAgent] = useState('generalis')
  const [agents, setAgents] = useState<{ presets: AgentPreset[]; custom: AgentPreset[] }>({ presets: [], custom: [] })
  const [saving, setSaving] = useState(false)

  const [newAgent, setNewAgent] = useState({ name: '', description: '', prompt: '' })

  useEffect(() => {
    refresh()
  }, [])

  async function refresh() {
    const [s, a] = await Promise.all([
      fetch(`${API}/api/me/settings`, { headers: pinHeader() }).then(r => r.json()),
      fetch(`${API}/api/agents`, { headers: pinHeader() }).then(r => r.json()),
    ])
    if (s.settings) {
      setData(s)
      setTelegramChatId(s.settings.telegram_chat_id || '')
      setDefaultAgent(s.settings.default_agent_id || 'generalis')
    }
    if (a.presets) setAgents({ presets: a.presets, custom: a.custom || [] })
  }

  async function saveSettings() {
    setSaving(true)
    await fetch(`${API}/api/me/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...pinHeader() },
      body: JSON.stringify({ telegramChatId, defaultAgentId: defaultAgent }),
    })
    await refresh()
    setSaving(false)
  }

  async function addCustomAgent() {
    if (!newAgent.name.trim() || !newAgent.prompt.trim()) return
    await fetch(`${API}/api/agents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...pinHeader() },
      body: JSON.stringify(newAgent),
    })
    setNewAgent({ name: '', description: '', prompt: '' })
    await refresh()
  }

  async function removeAgent(id: string) {
    await fetch(`${API}/api/agents/${id}`, {
      method: 'DELETE',
      headers: pinHeader(),
    })
    await refresh()
  }

  return (
    <div className="space-y-6">
      {/* Telegram */}
      <Bento padding="lg" tone="forest">
        <p className="vn-eyebrow !text-[var(--vn-mint)] mb-2">Telegram bot</p>
        <h3 className="vn-headline text-[20px] text-white mb-3">Akses asisten dari chat.</h3>
        <p className="text-white/75 text-[13.5px] leading-relaxed mb-4">
          Token bot di-set lewat <code className="bg-white/10 px-1.5 py-0.5 rounded">TELEGRAM_BOT_TOKEN</code> di <code>.env</code>.
          Tidak ditampilkan utuh di sini.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-white/55 mb-1.5">Status</p>
            <p className="text-white text-[14px]">
              {data?.telegramConfigured ? '✓ Bot aktif' : '✕ Belum diset'}
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-white/55 mb-1.5">Token (masked)</p>
            <p className="font-mono text-white text-[12px] break-all">{data?.telegramTokenMasked || '—'}</p>
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-[12px] uppercase tracking-wider text-white/55 mb-1.5">
            Telegram chat ID kamu
          </label>
          <input
            value={telegramChatId}
            onChange={e => setTelegramChatId(e.target.value)}
            placeholder="Dapatkan dari /start ke bot, copy chat.id"
            className="vn-input"
          />
          <p className="text-[11px] text-white/55 mt-2">
            Set agar bot Telegram bisa lanjutkan pekerjaan dari sesi web yang sama
            (cross-channel handoff).
          </p>
        </div>
      </Bento>

      {/* Default agent */}
      <Bento padding="lg" tone="cream">
        <p className="vn-eyebrow mb-3">Agent default</p>
        <h3 className="vn-headline text-[20px] mb-3">Pilih agent yang dipakai chat saat dibuka.</h3>
        <select value={defaultAgent} onChange={e => setDefaultAgent(e.target.value)} className="vn-input mb-3">
          {agents.presets.map(a => (
            <option key={a.id} value={a.id}>{a.name} — {a.description}</option>
          ))}
          {agents.custom.map(a => (
            <option key={a.id} value={a.id}>★ {a.name} — {a.description || 'custom'}</option>
          ))}
        </select>
        <button onClick={saveSettings} disabled={saving} className="vn-btn vn-btn-primary">
          {saving ? 'Menyimpan…' : 'Simpan pengaturan'}
        </button>
      </Bento>

      {/* Agent presets */}
      <Bento padding="lg">
        <p className="vn-eyebrow mb-3">Agent bawaan</p>
        <h3 className="vn-headline text-[20px] mb-5">{agents.presets.length} agent siap pakai.</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {agents.presets.map(a => (
            <div key={a.id} className="bg-[var(--vn-bg-deep)] rounded-2xl p-4">
              <p className="vn-headline text-[15px]">{a.name}</p>
              <p className="text-[12px] text-[var(--vn-muted)] mt-1">{a.description}</p>
            </div>
          ))}
        </div>
      </Bento>

      {/* Custom agents */}
      <Bento padding="lg">
        <p className="vn-eyebrow mb-3">Agent kustom</p>
        <h3 className="vn-headline text-[20px] mb-2">Buat asisten sesuai gayamu.</h3>
        <p className="text-[12.5px] text-[var(--vn-muted)] mb-5">
          Prompt yang kamu tulis akan diappend ke base system prompt — semua tool tetap
          tersedia kecuali kamu batasi via UI ini di iterasi berikutnya.
        </p>
        <div className="grid sm:grid-cols-2 gap-3 mb-5">
          <input
            value={newAgent.name}
            onChange={e => setNewAgent(s => ({ ...s, name: e.target.value }))}
            placeholder="Nama agent (contoh: Doi-Coach)"
            className="vn-input"
          />
          <input
            value={newAgent.description}
            onChange={e => setNewAgent(s => ({ ...s, description: e.target.value }))}
            placeholder="Deskripsi singkat"
            className="vn-input"
          />
        </div>
        <textarea
          value={newAgent.prompt}
          onChange={e => setNewAgent(s => ({ ...s, prompt: e.target.value }))}
          placeholder="System prompt — tulis aturan, gaya, fokus agent…"
          className="vn-input min-h-[120px] mb-3"
        />
        <button onClick={addCustomAgent} className="vn-btn vn-btn-primary mb-6">
          Simpan agent kustom
        </button>

        {agents.custom.length === 0 ? (
          <p className="text-[var(--vn-muted)] text-[14px]">Belum ada agent kustom.</p>
        ) : (
          <ul className="space-y-2">
            {agents.custom.map(a => (
              <li key={a.id} className="flex justify-between items-center bg-[var(--vn-bg-deep)] rounded-2xl px-4 py-3">
                <div>
                  <p className="vn-headline text-[15px]">★ {a.name}</p>
                  <p className="text-[12px] text-[var(--vn-muted)]">{a.description || 'custom'}</p>
                </div>
                <button onClick={() => removeAgent(a.id)} className="text-[12px] text-[var(--vn-red)] hover:underline">
                  Hapus
                </button>
              </li>
            ))}
          </ul>
        )}
      </Bento>

      {/* Privacy */}
      <Bento padding="lg" tone="ink">
        <p className="vn-eyebrow !text-[var(--vn-mint)] mb-2">Privasi & sesi</p>
        <h3 className="vn-headline text-[20px] text-white mb-3">Kunci sesi sekarang</h3>
        <p className="text-white/70 text-[13.5px] leading-relaxed mb-4">
          Logout dari sesi PIN ini saja (tab sekarang). Tidak menghapus data SQLite.
        </p>
        <button
          onClick={() => { clearPin(); window.location.reload() }}
          className="vn-btn vn-btn-on-dark"
        >
          Kunci sesi
        </button>
      </Bento>
    </div>
  )
}
