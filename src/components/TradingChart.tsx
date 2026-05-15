import { useEffect, useState, useMemo } from 'react'

const API = import.meta.env.VITE_API_URL || ''

type Point = { date?: string; close?: number; t?: number; price?: number }

type Props = {
  /** "saham" → Yahoo Finance, "crypto" → CoinGecko */
  kind: 'saham' | 'crypto'
  symbol: string
  height?: number
  showAxis?: boolean
  range?: '1mo' | '3mo' | '6mo' | '1y'
}

function colorPair(positive: boolean) {
  return positive
    ? { stroke: '#2f7d3a', fill: 'rgba(47, 125, 58, 0.12)' }
    : { stroke: '#b91c1c', fill: 'rgba(185, 28, 28, 0.10)' }
}

export default function TradingChart({
  kind,
  symbol,
  height = 200,
  showAxis = true,
  range = '3mo',
}: Props) {
  const [points, setPoints] = useState<{ x: number; y: number; label: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    setPoints([])

    async function load() {
      try {
        let rows: { x: number; y: number; label: string }[] = []
        if (kind === 'saham') {
          // Append .JK only for plain alphanumeric Indonesian tickers (e.g. BBCA).
          // US tickers (AAPL), indices (^JKSE), and futures (CL=F) are passed through.
          const isPlainIDXCode = /^[A-Z]{2,5}$/.test(symbol)
          const sym = isPlainIDXCode ? `${symbol}.JK` : symbol
          const res = await fetch(`${API}/api/market/history?symbol=${encodeURIComponent(sym)}&range=${range}`)
          const data = await res.json()
          if (data.error || !data.points?.length) throw new Error(data.error || 'no data')
          rows = data.points.map((p: Point, i: number) => ({
            x: i,
            y: Number(p.close) || 0,
            label: String(p.date || ''),
          }))
        } else {
          const days = range === '1mo' ? 30 : range === '6mo' ? 180 : range === '1y' ? 365 : 90
          const res = await fetch(
            `${API}/api/crypto/history?id=${encodeURIComponent(symbol.toLowerCase())}&days=${days}`,
          )
          const data = await res.json()
          if (data.error || !data.prices?.length) throw new Error(data.error || 'no data')
          rows = data.prices.map((p: [number, number], i: number) => ({
            x: i,
            y: p[1],
            label: new Date(p[0]).toISOString().slice(0, 10),
          }))
        }
        if (!cancelled) setPoints(rows)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'gagal memuat')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [kind, symbol, range])

  const layout = useMemo(() => {
    if (!points.length) return null
    const w = 600
    const h = height
    const padL = showAxis ? 56 : 8
    const padR = 12
    const padT = 12
    const padB = showAxis ? 28 : 8
    const xs = points.map(p => p.x)
    const ys = points.map(p => p.y)
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)
    const yPad = (maxY - minY) * 0.08 || 1
    const yLo = minY - yPad
    const yHi = maxY + yPad
    const sx = (v: number) => padL + ((v - minX) / (maxX - minX || 1)) * (w - padL - padR)
    const sy = (v: number) => padT + (1 - (v - yLo) / (yHi - yLo)) * (h - padT - padB)

    const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join(' ')
    const area = `${path} L${sx(maxX).toFixed(1)},${(h - padB).toFixed(1)} L${sx(minX).toFixed(1)},${(h - padB).toFixed(1)} Z`

    const first = points[0].y
    const last = points[points.length - 1].y
    const positive = last >= first
    const pct = ((last - first) / first) * 100

    const ticks = 4
    const yTicks = Array.from({ length: ticks + 1 }, (_, i) => yLo + ((yHi - yLo) * i) / ticks)
    const xLabelEvery = Math.max(1, Math.floor(points.length / 5))

    return { w, h, padL, padR, padT, padB, sx, sy, path, area, positive, pct, yTicks, xLabelEvery, last, first }
  }, [points, height, showAxis])

  if (loading) {
    return (
      <div className="rounded-2xl bg-[var(--vn-bg-deep)] p-6 text-[13px] text-[var(--vn-muted)]" style={{ height }}>
        Memuat grafik {symbol}…
      </div>
    )
  }
  if (error || !layout) {
    return (
      <div className="rounded-2xl bg-[var(--vn-bg-deep)] p-6 text-[13px] text-[var(--vn-muted)]" style={{ height }}>
        Grafik tidak tersedia: {error || 'no data'}
      </div>
    )
  }

  const c = colorPair(layout.positive)

  return (
    <div className="rounded-2xl bg-[var(--vn-bg-soft)] p-3 border border-[var(--vn-line)]" style={{ minHeight: height }}>
      <div className="flex items-baseline justify-between mb-1.5 px-2">
        <p className="vn-headline text-[14px]">{symbol}</p>
        <p className={`text-[12px] font-mono ${layout.positive ? 'text-[var(--vn-forest)]' : 'text-[var(--vn-red)]'}`}>
          {layout.positive ? '↑' : '↓'} {layout.pct.toFixed(2)}% · {range}
        </p>
      </div>
      <svg viewBox={`0 0 ${layout.w} ${layout.h}`} width="100%" height={layout.h} preserveAspectRatio="none" aria-hidden>
        {showAxis &&
          layout.yTicks.map((t, i) => (
            <g key={i}>
              <line
                x1={layout.padL}
                x2={layout.w - layout.padR}
                y1={layout.sy(t)}
                y2={layout.sy(t)}
                stroke="rgba(15, 23, 19, 0.08)"
                strokeWidth={1}
              />
              <text x={layout.padL - 6} y={layout.sy(t) + 4} fontSize="10" textAnchor="end" fill="#98a39c">
                {Math.round(t).toLocaleString()}
              </text>
            </g>
          ))}
        <path d={layout.area} fill={c.fill} />
        <path d={layout.path} fill="none" stroke={c.stroke} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        {showAxis &&
          points.map((p, i) =>
            i % layout.xLabelEvery === 0 ? (
              <text key={i} x={layout.sx(p.x)} y={layout.h - 8} fontSize="10" textAnchor="middle" fill="#98a39c">
                {p.label.slice(5)}
              </text>
            ) : null,
          )}
      </svg>
    </div>
  )
}
