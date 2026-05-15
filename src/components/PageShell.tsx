import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

type Props = {
  title: string
  subtitle?: string
  icon?: string
  children: ReactNode
}

export default function PageShell({ title, subtitle, icon, children }: Props) {
  return (
    <div className="page-shell">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          {icon && <span>{icon}</span>}
          <span className="bg-gradient-to-r from-white via-emerald-200 to-cyan-300 bg-clip-text text-transparent">
            {title}
          </span>
        </h1>
        {subtitle && <p className="text-slate-400 mb-8">{subtitle}</p>}
        {children}
      </motion.div>
    </div>
  )
}

export function GlassPanel({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`glass rounded-2xl panel-glass ${className}`}>{children}</div>
  )
}
