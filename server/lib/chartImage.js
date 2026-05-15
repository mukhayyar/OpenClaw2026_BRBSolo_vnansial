/**
 * Chart-to-image helper for Telegram.
 *
 * Strategy: build a Chart.js config from price-history data, encode it
 * into a QuickChart.io URL (free, no key needed, returns PNG). Telegram
 * `sendPhoto` accepts either an URL or a multipart upload — we pass the
 * URL directly so we never hold the PNG in memory.
 *
 * Falls back to a text price summary if the upstream history call fails.
 */

import { getHistorical } from './yahoo.js'
import { getCoinHistory } from './coingecko.js'

const QC_BASE = 'https://quickchart.io/chart'

function brandConfig({ label, points, color = '#2f7d3a' }) {
  return {
    type: 'line',
    data: {
      labels: points.map(p => p.label),
      datasets: [
        {
          label,
          data: points.map(p => p.value),
          borderColor: color,
          backgroundColor: 'rgba(47, 125, 58, 0.15)',
          borderWidth: 2.5,
          fill: true,
          tension: 0.3,
          pointRadius: 0,
        },
      ],
    },
    options: {
      plugins: {
        title: { display: true, text: label, font: { size: 16, weight: 'bold' } },
        legend: { display: false },
      },
      scales: {
        x: { ticks: { maxTicksLimit: 6 } },
        y: { beginAtZero: false },
      },
    },
  }
}

function toUrl(config, width = 720, height = 360) {
  const encoded = encodeURIComponent(JSON.stringify(config))
  return `${QC_BASE}?w=${width}&h=${height}&bkg=white&format=png&c=${encoded}`
}

/**
 * Fetch price history for a chart marker and return a Telegram-ready
 * payload: { photoUrl, caption } or { caption } if history unavailable.
 */
export async function buildChartTelegramPayload({ kind, symbol, range = '3mo' }) {
  let points = []
  let label = `${symbol} · ${range}`

  try {
    if (kind === 'saham') {
      const sym = symbol.includes('.') ? symbol : `${symbol}.JK`
      const h = await getHistorical(sym, range)
      if (h.error || !h.points?.length) {
        return { caption: `Grafik ${symbol} tidak tersedia: ${h.error || 'no data'}` }
      }
      points = h.points
        .filter(p => Number.isFinite(p.close))
        .map(p => ({ label: String(p.date || '').slice(5), value: p.close }))
      label = `${sym} · ${range}`
    } else if (kind === 'crypto') {
      const days = range === '1mo' ? 30 : range === '6mo' ? 180 : range === '1y' ? 365 : 90
      const h = await getCoinHistory(symbol.toLowerCase(), days)
      if (h.error || !h.prices?.length) {
        return { caption: `Grafik ${symbol} tidak tersedia: ${h.error || 'no data'}` }
      }
      points = h.prices.map(([t, v]) => ({
        label: new Date(t).toISOString().slice(5, 10),
        value: v,
      }))
      label = `${symbol.toUpperCase()} · USD · ${range}`
    } else {
      return { caption: `Tipe chart tidak dikenal: ${kind}` }
    }

    if (!points.length) {
      return { caption: `Grafik ${symbol} kosong setelah filter.` }
    }

    // Compute summary for caption
    const first = points[0].value
    const last = points[points.length - 1].value
    const pct = ((last - first) / first) * 100
    const positive = pct >= 0
    const color = positive ? '#2f7d3a' : '#b91c1c'

    const config = brandConfig({ label, points, color })
    const photoUrl = toUrl(config)

    const caption =
      `*${label}*\n` +
      `Terakhir: \`${last.toLocaleString('id-ID')}\` · ` +
      `${positive ? '↑' : '↓'} *${pct.toFixed(2)}%*\n` +
      `_Sumber: ${kind === 'saham' ? 'Yahoo Finance' : 'CoinGecko'} (delayed). Bukan saran beli/jual._`

    return { photoUrl, caption }
  } catch (err) {
    return { caption: `Grafik ${symbol} error: ${err.message}` }
  }
}

/**
 * Scan an assistant message for [[chart:kind:symbol:range]] markers and
 * return them as an array. Used by the Telegram bot to know whether to
 * dispatch sendPhoto calls in addition to (or instead of) sendMessage.
 */
export function extractChartMarkers(text) {
  const re = /\[\[chart:(saham|crypto):([A-Za-z0-9._-]+)(?::(1mo|3mo|6mo|1y))?\]\]/g
  const out = []
  let m
  while ((m = re.exec(text || '')) !== null) {
    out.push({ kind: m[1], symbol: m[2], range: m[3] || '3mo', raw: m[0] })
  }
  return out
}

/** Remove chart markers from the text so we don't echo them in Telegram captions. */
export function stripChartMarkers(text) {
  return (text || '').replace(/\[\[chart:[^\]]+\]\]/g, '').trim()
}

/** Remove both chart and TA markers from text. */
export function stripAllMarkers(text) {
  return (text || '').replace(/\[\[(chart|ta):[^\]]+\]\]/g, '').trim()
}

// ----- Technical Analysis helpers ----------------------------------

function computeMA(values, period) {
  const out = []
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) { out.push(null); continue }
    let sum = 0
    for (let j = i - period + 1; j <= i; j++) sum += values[j]
    out.push(sum / period)
  }
  return out
}

function computeBollinger(values, period = 20, stdDev = 2) {
  const ma = computeMA(values, period)
  const upper = []
  const lower = []
  for (let i = 0; i < ma.length; i++) {
    if (ma[i] == null) { upper.push(null); lower.push(null); continue }
    let sumSq = 0
    for (let j = i - period + 1; j <= i; j++) sumSq += (values[j] - ma[i]) ** 2
    const sd = Math.sqrt(sumSq / period)
    upper.push(ma[i] + sd * stdDev)
    lower.push(ma[i] - sd * stdDev)
  }
  return { upper, lower, middle: ma }
}

function taChartConfig({ label, points, values }) {
  const ma20 = computeMA(values, 20)
  const ma50 = computeMA(values, 50)
  const bb = computeBollinger(values, 20, 2)

  const last = values[values.length - 1]
  const first = values[0]
  const pct = ((last - first) / first) * 100
  const color = pct >= 0 ? '#2f7d3a' : '#b91c1c'

  return {
    type: 'line',
    data: {
      labels: points.map(p => p.label),
      datasets: [
        {
          label: 'Harga',
          data: values,
          borderColor: color,
          backgroundColor: 'rgba(47, 125, 58, 0.08)',
          borderWidth: 2,
          fill: true,
          tension: 0.3,
          pointRadius: 0,
          order: 2,
        },
        {
          label: 'MA 20',
          data: ma20,
          borderColor: '#f59e0b',
          borderWidth: 1.2,
          fill: false,
          tension: 0.3,
          pointRadius: 0,
          order: 1,
        },
        {
          label: 'MA 50',
          data: ma50,
          borderColor: '#3b82f6',
          borderWidth: 1.2,
          fill: false,
          tension: 0.3,
          pointRadius: 0,
          order: 1,
        },
        {
          label: 'BB Upper',
          data: bb.upper,
          borderColor: 'rgba(107, 114, 128, 0.4)',
          borderWidth: 0.8,
          borderDash: [4, 3],
          fill: false,
          tension: 0.3,
          pointRadius: 0,
          order: 1,
        },
        {
          label: 'BB Lower',
          data: bb.lower,
          borderColor: 'rgba(107, 114, 128, 0.4)',
          borderWidth: 0.8,
          borderDash: [4, 3],
          fill: false,
          tension: 0.3,
          pointRadius: 0,
          order: 1,
        },
      ],
    },
    options: {
      plugins: {
        title: { display: true, text: label + ' — Analisa Teknikal', font: { size: 14, weight: 'bold' } },
        legend: { display: true, position: 'bottom', labels: { boxWidth: 20, font: { size: 10 } } },
      },
      scales: {
        x: { ticks: { maxTicksLimit: 8 } },
        y: { beginAtZero: false },
      },
    },
  }
}

export async function buildTechnicalChartPayload({ kind, symbol, range = '3mo' }) {
  let points = []
  let label = `${symbol} · ${range}`

  try {
    if (kind === 'saham') {
      const sym = symbol.includes('.') ? symbol : `${symbol}.JK`
      const h = await getHistorical(sym, range)
      if (h.error || !h.points?.length) {
        return { caption: `Grafik teknikal ${symbol} tidak tersedia: ${h.error || 'no data'}` }
      }
      const filtered = h.points.filter(p => Number.isFinite(p.close))
      points = filtered.map(p => ({ label: String(p.date || '').slice(5), value: p.close }))
      label = `${sym} · Analisa Teknikal · ${range}`
    } else if (kind === 'crypto') {
      const days = range === '1mo' ? 30 : range === '6mo' ? 180 : range === '1y' ? 365 : 90
      const h = await getCoinHistory(symbol.toLowerCase(), days)
      if (h.error || !h.prices?.length) {
        return { caption: `Grafik teknikal ${symbol} tidak tersedia: ${h.error || 'no data'}` }
      }
      points = h.prices.map(([t, v]) => ({
        label: new Date(t).toISOString().slice(5, 10),
        value: v,
      }))
      label = `${symbol.toUpperCase()} · Analisa Teknikal · USD · ${range}`
    } else {
      return { caption: `Tipe chart tidak dikenal: ${kind}` }
    }

    if (points.length < 20) return { caption: `Data ${symbol} terlalu sedikit untuk analisa teknikal (butuh min 20 candle).` }

    const values = points.map(p => p.value)
    const config = taChartConfig({ label, points, values })
    const photoUrl = `${QC_BASE}?w=800&h=480&bkg=white&format=png&c=${encodeURIComponent(JSON.stringify(config))}`

    const last = values[values.length - 1]
    const first = values[0]
    const pct = ((last - first) / first) * 100
    const ma20arr = computeMA(values, 20)
    const lastMA20 = ma20arr.findLast(v => v != null) || last
    const bb = computeBollinger(values, 20, 2)
    const lastBBUpper = bb.upper.findLast(v => v != null) || last
    const lastBBLower = bb.lower.findLast(v => v != null) || last

    const caption =
      `*${label}*\n` +
      `Harga: \`${last.toLocaleString('id-ID')}\` · ${pct >= 0 ? '↑' : '↓'} *${pct.toFixed(2)}%*\n` +
      `MA20: \`${lastMA20.toLocaleString('id-ID')}\` · BB: \`${lastBBLower.toLocaleString('id-ID')}\` – \`${lastBBUpper.toLocaleString('id-ID')}\`\n` +
      `_Sumber: ${kind === 'saham' ? 'Yahoo Finance' : 'CoinGecko'} (delayed). Bukan saran beli/jual._`

    return { photoUrl, caption }
  } catch (err) {
    return { caption: `Grafik teknikal ${symbol} error: ${err.message}` }
  }
}

export function extractTechnicalMarkers(text) {
  const re = /\[\[ta:(saham|crypto):([A-Za-z0-9._-]+):(1mo|3mo|6mo|1y):([a-z,]+)\]\]/g
  const out = []
  let m
  while ((m = re.exec(text || '')) !== null) {
    out.push({ kind: m[1], symbol: m[2], range: m[3], indicators: m[4], raw: m[0] })
  }
  return out
}
