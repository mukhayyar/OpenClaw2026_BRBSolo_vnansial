/**
 * Calm "live status" strip. Replaces the old neon scroll with a subtle
 * always-online indicator + a single rotating wellness reminder.
 */
import { useEffect, useState } from 'react'

const REMINDERS = [
  'Selalu cek izin OJK sebelum investasi · 157',
  'Bunga pinjol legal maksimal 0,4% per hari',
  'Dana darurat ideal 3–6 bulan pengeluaran',
  'Jangan share KTP, OTP, atau PIN ke siapa pun',
  'Return investasi pasti >2%/bulan = waspada',
]

export default function AgentTicker() {
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % REMINDERS.length), 5200)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="bg-[var(--vn-bg-soft)] border-b border-[var(--vn-line)]">
      <div className="vn-container h-9 flex items-center justify-between text-[12px] text-[var(--vn-muted)]">
        <span className="flex items-center gap-2">
          <span className="vn-dot vn-pulse" />
          Asisten online
        </span>
        <span
          key={idx}
          className="hidden sm:inline truncate max-w-[60%]"
          style={{ animation: 'vn-toast-in 0.4s ease-out' }}
        >
          {REMINDERS[idx]}
        </span>
        <span className="hidden md:inline text-[var(--vn-faint)]">Gratis · Bahasa Indonesia</span>
      </div>
    </div>
  )
}
