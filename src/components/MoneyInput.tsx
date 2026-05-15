import { useState, useEffect } from 'react'

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
  ariaLabel?: string
}

/**
 * Indonesian-locale currency input. Display formatted with thousand
 * separators (1.000.000), strips on edit, emits a clean number to the
 * parent. Use anywhere we previously had `<input type="number">` for
 * Rupiah values.
 */
export default function MoneyInput({
  value,
  onChange,
  placeholder = '0',
  className = '',
  disabled,
  prefix = 'Rp',
  noPrefix,
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

  return (
    <div className={`relative ${className}`}>
      {!noPrefix && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-[var(--vn-muted)] font-medium pointer-events-none">
          {prefix}
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
        className={`vn-input ${noPrefix ? '' : 'pl-9'} font-mono`}
      />
    </div>
  )
}

function formatLocale(n: number | undefined): string {
  if (!Number.isFinite(n) || !n) return ''
  return Number(n).toLocaleString('id-ID')
}
