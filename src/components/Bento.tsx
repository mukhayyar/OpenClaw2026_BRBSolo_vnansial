import type { ReactNode } from 'react'
import { motion } from 'framer-motion'

type Tone = 'cream' | 'mint' | 'deep' | 'forest' | 'ink' | 'white'

const toneClass: Record<Tone, string> = {
  white: '',
  cream: 'bento-cream',
  mint: 'bento-mint',
  deep: 'bento-deep',
  forest: 'bento-forest',
  ink: 'bento-ink',
}

type Props = {
  children: ReactNode
  tone?: Tone
  className?: string
  padding?: 'sm' | 'md' | 'lg'
  delay?: number
  span?: string
  as?: 'div' | 'button' | 'a' | 'section'
  onClick?: () => void
  href?: string
  ariaLabel?: string
}

export default function Bento({
  children,
  tone = 'white',
  className = '',
  padding = 'md',
  delay = 0,
  span = '',
  as = 'div',
  onClick,
  href,
  ariaLabel,
}: Props) {
  const padCls = padding === 'lg' ? 'bento-pad-lg' : padding === 'sm' ? 'p-5 sm:p-6' : 'bento-pad'

  const cls = `bento ${toneClass[tone]} ${padCls} ${span} ${className}`

  if (as === 'a' && href) {
    return (
      <motion.a
        href={href}
        aria-label={ariaLabel}
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1], delay }}
        className={cls}
      >
        {children}
      </motion.a>
    )
  }

  if (as === 'button') {
    return (
      <motion.button
        type="button"
        aria-label={ariaLabel}
        onClick={onClick}
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1], delay }}
        className={`text-left ${cls}`}
      >
        {children}
      </motion.button>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1], delay }}
      className={cls}
    >
      {children}
    </motion.div>
  )
}
