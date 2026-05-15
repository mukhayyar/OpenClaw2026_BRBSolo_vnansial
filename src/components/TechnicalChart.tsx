import { useEffect, useMemo, useState } from 'react'

const API = import.meta.env.VITE_API_URL || ''

interface Point { label: string; value: number }

function calcMA(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = []
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) { out.push(null); continue }
    let sum = 0
    for (let j = i - period + 1; j <= i; j++) sum += values[j]
    out.push(sum / period)
  }
  return out
}

function calcBB(values: number[], period = 20, stdDev = 2) {
  const ma = calcMA(values, period)
  const upper: (number | null)[] = []
  const lower: (number | null)[] = []
  for (let i = 0; i < ma.length; i++) {
    if (ma[i] == null) { upper.push(null); lower.push(null); continue }
    let sumSq = 0
    for (let j = i - period + 1; j <= i; j++) sumSq += (values[j] - ma[i]!) ** 2
    const sd = Math.sqrt(sumSq / period)
    upper.push(ma[i]! + sd * stdDev)
    lower.push(ma[i]! - sd * stdDev)
  }
  return { upper, lower, middle: ma }
}

interface TAChartProps {
  kind: 'saham' | 'crypto'
  symbol: string
  range: string
  height?: number
}

export default function TechnicalChart({ kind, symbol, range = '3mo', height = 260 }: TAChartProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [points, setPoints] = useState<Point[]>([])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    ;(async () => {
      try {
        if (kind === 'saham') {
          const sym = symbol.includes('.') ? symbol : `${symbol}.JK`
          const res = await fetch(`${API}/api/market/history?symbol=${encodeURIComponent(sym)}&range=${range}`)
          const d = await res.json()
          if (d.error) throw new Error(d.error)
          setPoints(d.points?.filter((p: any) => Number.isFinite(p.close)).map((p: any) => ({
            label: String(p.date || '').slice(5),
            value: p.close,
          })) || [])
        } else {
          const days = range === '1mo' ? 30 : range === '6mo' ? 180 : range === '1y' ? 365 : 90
          const res = await fetch(`${API}/api/crypto/history?id=${encodeURIComponent(symbol.toLowerCase())}&days=${days}`)
          const d = await res.json()
          if (d.error) throw new Error(d.error)
          setPoints(d.prices?.map(([t, v]: [number, number]) => ({
            label: new Date(t).toISOString().slice(5, 10),
            value: v,
          })) || [])
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Gagal memuat')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [kind, symbol, range])

  const { paths, ma20Visible, ma50Visible, bbUpperVisible, bbLowerVisible } = useMemo(() => {
    if (!points.length) return { paths: null, ma20Visible: false, ma50Visible: false, bbUpperVisible: false, bbLowerVisible: false }

    const values = points.map(p => p.value)
    const ma20 = calcMA(values, 20)
    const ma50 = calcMA(values, 50)
    const bb = calcBB(values, 20, 2)

    const margin = { top: 10, right: 10, bottom: 30, left: 10 }
    const w = 700
    const h = height
    const pw = w - margin.left - margin.right
    const ph = h - margin.top - margin.bottom

    const allVals = [...values, ...ma20.filter(v => v != null) as number[], ...ma50.filter(v => v != null) as number[], ...bb.upper.filter(v => v != null) as number[], ...bb.lower.filter(v => v != null) as number[]]
    const min = Math.min(...allVals)
    const max = Math.max(...allVals)
    const rangeV = max - min || 1
    const x = (i: number) => margin.left + (i / Math.max(values.length - 1, 1)) * pw
    const y = (v: number) => margin.top + ph - ((v - min) / rangeV) * ph

    const toPath = (arr: (number | null)[], skipNull = true) => {
      let d = ''
      let started = false
      for (let i = 0; i < arr.length; i++) {
        if (arr[i] == null) {
          if (skipNull) started = false
          continue
        }
        if (!started) { d += `M${x(i)},${y(arr[i]!)}`; started = true }
        else d += `L${x(i)},${y(arr[i]!)}`
      }
      return d
    }

    const areaPath = (arr: (number | null)[]) => {
      let d = toPath(arr, true)
      if (!d) return ''
      const lastI = arr.length - 1
      const firstI = arr.findIndex(v => v != null)
      d += `L${x(lastI)},${y(min)}L${x(firstI)},${y(min)}Z`
      return d
    }

    return {
      paths: {
        price: toPath(values, false),
        priceArea: areaPath(values),
        ma20: toPath(ma20, true),
        ma50: toPath(ma50, true),
        bbUpper: toPath(bb.upper, true),
        bbLower: toPath(bb.lower, true),
      },
      ma20Visible: ma20.some(v => v != null),
      ma50Visible: ma50.some(v => v != null),
      bbUpperVisible: bb.upper.some(v => v != null),
      bbLowerVisible: bb.lower.some(v => v != null),
    }
  }, [points, height])

  if (loading) return <div className="h-[260px] flex items-center justify-center text-[var(--vn-muted)] text-[13px]">Memuat grafik teknikal…</div>
  if (error) return <div className="h-[260px] flex items-center justify-center text-[var(--vn-red)] text-[13px]">{error}</div>
  if (!points.length || !paths) return null

  const first = points[0].value
  const last = points[points.length - 1].value
  const pct = ((last - first) / first) * 100
  const positive = pct >= 0
  const color = positive ? '#2f7d3a' : '#b91c1c'

  return (
    <div className="bg-[var(--vn-bg-deep)] rounded-2xl p-3 not-prose">
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-[11px] font-mono text-[var(--vn-forest-dark)] font-bold">
          {symbol.toUpperCase()} · Analisa Teknikal · {range}
        </span>
        <div className="flex gap-3 text-[10px] text-[var(--vn-muted)]">
          <span className="flex items-center gap-1"><span className="w-2 h-0.5 rounded bg-amber-400 inline-block" /> MA20</span>
          <span className="flex items-center gap-1"><span className="w-2 h-0.5 rounded bg-blue-500 inline-block" /> MA50</span>
          <span className="flex items-center gap-1"><span className="w-2 h-0.5 rounded bg-gray-400 inline-block" style={{ borderTop: '1px dashed #9ca3af' }} /> BB</span>
        </div>
      </div>
      <svg viewBox={`0 0 700 ${height}`} className="w-full" style={{ height }}>
        {/* Bollinger Bands area */}
        {bbUpperVisible && bbLowerVisible && (
          <path d={`${paths.bbUpper}L${paths.bbLower.split('M').pop()?.replace(/^.*?L/, '').split('L').reverse().join('L')}Z`} fill="rgba(107,114,128,0.06)" />
        )}
        {/* Price area fill */}
        <path d={paths.priceArea} fill={positive ? 'rgba(47,125,58,0.1)' : 'rgba(185,28,28,0.06)'} />
        {/* Bollinger Bands */}
        <path d={paths.bbUpper} fill="none" stroke="rgba(107,114,128,0.45)" strokeWidth={0.7} strokeDasharray="4,3" />
        <path d={paths.bbLower} fill="none" stroke="rgba(107,114,128,0.45)" strokeWidth={0.7} strokeDasharray="4,3" />
        {/* MA lines */}
        {ma20Visible && <path d={paths.ma20} fill="none" stroke="#f59e0b" strokeWidth={1} />}
        {ma50Visible && <path d={paths.ma50} fill="none" stroke="#3b82f6" strokeWidth={1} />}
        {/* Price line */}
        <path d={paths.price} fill="none" stroke={color} strokeWidth={1.8} />
      </svg>
      <div className="flex justify-between mt-1.5 px-1">
        <span className="text-[10px] text-[var(--vn-muted)]">
          Harga: {last.toLocaleString('id-ID')}
        </span>
        <span className={`text-[10px] font-mono ${positive ? 'text-[var(--vn-forest)]' : 'text-[var(--vn-red)]'}`}>
          {positive ? '↑' : '↓'} {Math.abs(pct).toFixed(1)}%
        </span>
      </div>
    </div>
  )
}
