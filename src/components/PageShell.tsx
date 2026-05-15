import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

type Props = {
  eyebrow?: string
  title: string
  subtitle?: string
  children: ReactNode
  tone?: 'default' | 'cream'
}

export default function PageShell({ eyebrow, title, subtitle, children, tone = 'default' }: Props) {
  return (
    <div className={tone === 'cream' ? 'bg-[var(--vn-bg-soft)]' : 'bg-white'}>
      <div className="vn-container vn-section">
        <motion.header
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
          className="max-w-3xl mb-10 sm:mb-14"
        >
          {eyebrow && <p className="vn-eyebrow mb-3">{eyebrow}</p>}
          <h1 className="vn-display text-[40px] sm:text-[56px] mb-4">{title}</h1>
          {subtitle && (
            <p className="text-[18px] text-[var(--vn-ink-soft)] leading-relaxed max-w-2xl">
              {subtitle}
            </p>
          )}
        </motion.header>
        {children}
      </div>
    </div>
  )
}
