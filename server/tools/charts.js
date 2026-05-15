/**
 * Chart-rendering tool. The model returns a structured chart spec; the
 * UI scans the assistant message for `[[chart:kind:symbol:range]]`
 * markers and renders <TradingChart/> inline.
 *
 * The tool result also includes the marker so the model can copy it
 * verbatim into its reply.
 */

const VALID_KINDS = new Set(['saham', 'crypto'])
const VALID_RANGES = new Set(['1mo', '3mo', '6mo', '1y'])

export function renderChart(args = {}) {
  const kind = String(args.kind || '').toLowerCase()
  const symbol = String(args.symbol || '').trim()
  const range = String(args.range || '3mo').toLowerCase()
  if (!VALID_KINDS.has(kind)) {
    return { error: 'kind harus "saham" atau "crypto".' }
  }
  if (!symbol) {
    return { error: 'symbol wajib (contoh: BBCA atau bitcoin).' }
  }
  const r = VALID_RANGES.has(range) ? range : '3mo'
  const marker = `[[chart:${kind}:${symbol}:${r}]]`
  return {
    ok: true,
    kind,
    symbol,
    range: r,
    marker,
    instruction:
      `Sertakan marker ini di jawabanmu tepat di tempat kamu ingin grafik tampil: ${marker}. ` +
      `UI akan otomatis mengganti marker dengan grafik interaktif. Jangan tampilkan marker mentah ke user lebih dari satu kali.`,
  }
}
