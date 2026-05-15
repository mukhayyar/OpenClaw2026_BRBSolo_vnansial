type Props = {
  page: number
  total: number
  pageSize: number
  onChange: (p: number) => void
  className?: string
}

export default function Pagination({ page, total, pageSize, onChange, className = '' }: Props) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  if (pages <= 1) return null
  const pageList: (number | '…')[] = []
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || (i >= page - 1 && i <= page + 1)) pageList.push(i)
    else if (pageList[pageList.length - 1] !== '…') pageList.push('…')
  }
  return (
    <div className={`mt-3 flex items-center justify-center gap-1.5 text-[12px] ${className}`}>
      <button
        type="button"
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page <= 1}
        className="px-2.5 py-1 rounded-full bg-[var(--vn-bg-deep)] disabled:opacity-40"
      >
        ←
      </button>
      {pageList.map((p, i) =>
        p === '…' ? (
          <span key={`g-${i}`} className="text-[var(--vn-muted)]">…</span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            className={`min-w-[28px] px-2 py-1 rounded-full font-medium ${
              p === page ? 'bg-[var(--vn-forest)] text-white' : 'bg-[var(--vn-bg-deep)] text-[var(--vn-ink-soft)]'
            }`}
          >
            {p}
          </button>
        ),
      )}
      <button
        type="button"
        onClick={() => onChange(Math.min(pages, page + 1))}
        disabled={page >= pages}
        className="px-2.5 py-1 rounded-full bg-[var(--vn-bg-deep)] disabled:opacity-40"
      >
        →
      </button>
    </div>
  )
}
