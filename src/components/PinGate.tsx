import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { getPin, setPin as savePin, verifyPin, clearPin } from '../lib/auth'

type Props = {
  title?: string
  reason?: string
  optional?: boolean
  onUnlock?: () => void
  children: React.ReactNode
}

export default function PinGate({
  title = 'Buka kunci data pribadi',
  reason = 'Data ini disimpan di SQLite dan butuh PIN supaya hanya kamu yang bisa membuka — bahkan asisten AI tidak bisa mengakses tanpa PIN.',
  optional,
  onUnlock,
  children,
}: Props) {
  const [pin, setPinLocal] = useState('')
  const [unlocked, setUnlocked] = useState(Boolean(getPin()))
  const [mode, setMode] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // If PIN env is open mode, auto-unlock
    verifyPin(getPin()).then(r => {
      if (r.ok) setUnlocked(true)
      if (r.mode) setMode(r.mode)
    })
  }, [])

  async function unlock() {
    setError(null)
    setLoading(true)
    const r = await verifyPin(pin.trim())
    setLoading(false)
    if (!r.ok) {
      setError('PIN salah. Cek lagi atau set ulang di .env (VNANSIAL_PIN).')
      return
    }
    savePin(pin.trim())
    setUnlocked(true)
    setMode(r.mode || null)
    onUnlock?.()
  }

  function lock() {
    clearPin()
    setUnlocked(false)
    setPinLocal('')
  }

  if (unlocked) {
    return (
      <>
        {mode === 'pin' && (
          <div className="mb-4 flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-[var(--vn-cream)] text-[12.5px] text-[var(--vn-forest-dark)]">
            <span className="flex items-center gap-2">
              <span className="vn-dot vn-pulse" />
              Sesi privat aktif — data SQLite terbuka untuk kamu & asisten AI di tab ini.
            </span>
            <button onClick={lock} className="underline hover:text-[var(--vn-forest)]">
              Kunci
            </button>
          </div>
        )}
        {children}
      </>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bento bento-pad-lg bento-cream max-w-xl mx-auto"
    >
      <p className="vn-eyebrow mb-3">Privasi</p>
      <h3 className="vn-headline text-[22px] mb-2">{title}</h3>
      <p className="text-[14px] text-[var(--vn-ink-soft)] leading-relaxed mb-5">{reason}</p>
      <label className="block text-[12px] text-[var(--vn-muted)] uppercase tracking-wider mb-1.5">
        PIN
      </label>
      <input
        type="password"
        value={pin}
        onChange={e => setPinLocal(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && unlock()}
        placeholder="••••"
        className="vn-input mb-3"
        autoFocus
      />
      {error && <p className="text-[var(--vn-red)] text-[13px] mb-3">{error}</p>}
      <div className="flex gap-2 flex-wrap">
        <button onClick={unlock} disabled={loading} className="vn-btn vn-btn-primary">
          {loading ? 'Memeriksa…' : 'Buka kunci'}
        </button>
        {optional && (
          <button onClick={onUnlock} className="vn-btn vn-btn-ghost">
            Lewati untuk sekarang
          </button>
        )}
      </div>
      <p className="text-[12px] text-[var(--vn-muted)] mt-4 leading-relaxed">
        PIN diset oleh pemilik server lewat <code>VNANSIAL_PIN</code> di
        <code>.env</code>. Tanpa PIN, fitur ini tetap bisa pakai data lokal
        (browser-only) tanpa sync ke server.
      </p>
    </motion.div>
  )
}
