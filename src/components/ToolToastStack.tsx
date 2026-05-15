import { useEffect, useState } from 'react'

type Toast = { id: number; name: string }

export default function ToolToastStack() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    const handler = (e: Event) => {
      const name = (e as CustomEvent<{ name: string }>).detail?.name
      if (!name) return
      const id = Date.now() + Math.random()
      setToasts(t => [...t.slice(-4), { id, name }])
      setTimeout(() => {
        setToasts(t => t.filter(x => x.id !== id))
      }, 4200)
    }
    window.addEventListener('vn-tool', handler)
    return () => window.removeEventListener('vn-tool', handler)
  }, [])

  if (!toasts.length) return null

  return (
    <div className="fixed top-20 right-4 z-[100] flex flex-col gap-2 max-w-xs pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className="tool-toast glass-strong rounded-xl px-4 py-3 border border-cyan-500/30 pointer-events-auto"
        >
          <div className="flex items-center gap-2 text-xs text-cyan-400 font-mono mb-0.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 status-pulse" />
            TX CONFIRMED
          </div>
          <p className="text-sm text-slate-200">
            Tool executed: <span className="text-emerald-400 font-semibold">{t.name}</span>
          </p>
        </div>
      ))}
    </div>
  )
}
