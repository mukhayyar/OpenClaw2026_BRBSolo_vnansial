import { useEffect, useState } from 'react'

type Props = {
  value: number
  onChange: (v: number) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  /** Currency prefix; default Rp */
  prefix?: string
  /** Show as plain locale string (1.000.000) without prefix */
  noPrefix?: boolean
  /** Optional secondary currency code shown after the value (e.g. USD) */
  currency?: string
  ariaLabel?: string
}

/**
 * Indonesian-locale currency input. Display formatted with thousand
 * separators (1.000.000), strips on edit, emits a clean number to the
 * parent. Use anywhere we previously had `<input type="number">` for
 * Rupiah values.
 *
 * Uses inline style for padding so `.vn-input { padding: ... }` doesn't
 * win the cascade over Tailwind utility classes.
 */
export default function MoneyInput({
  value,
  onChange,
  placeholder = '',
  className = '',
  disabled,
  prefix = 'Rp',
  noPrefix,
  currency,
  ariaLabel,
}: Props) {
  const [text, setText] = useState(formatLocale(value))

  useEffect(() => {
    setText(formatLocale(value))
  }, [value])

  function handle(raw: string) {
    const digits = raw.replace(/[^\d]/g, '')
    setText(digits ? Number(digits).toLocaleString('id-ID') : '')
    onChange(digits ? Number(digits) : 0)
  }

  const leftPad = noPrefix ? undefined : '2.5rem'
  const rightPad = currency ? '3rem' : undefined

  return (
    <div className={`relative ${className}`}>
      {!noPrefix && (
        <span
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-[var(--vn-muted)] font-semibold pointer-events-none select-none"
          aria-hidden
        >
          {prefix}
        </span>
      )}
      {currency && (
        <span
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-[var(--vn-muted)] font-semibold pointer-events-none select-none uppercase tracking-wider"
          aria-hidden
        >
          {currency}
        </span>
      )}
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={text}
        onChange={e => handle(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        aria-label={ariaLabel}
        className="vn-input font-mono"
        style={{
          paddingLeft: leftPad,
          paddingRight: rightPad,
        }}
      />
    </div>
  )
}

function formatLocale(n: number | undefined): string {
  if (!Number.isFinite(n) || !n) return ''
  return Number(n).toLocaleString('id-ID')
}
