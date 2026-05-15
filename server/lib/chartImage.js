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

/** Remove markers from the text so we don't echo them in Telegram captions. */
export function stripChartMarkers(text) {
  return (text || '').replace(/\[\[chart:[^\]]+\]\]/g, '').trim()
}
