import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { runAgentChat } from './agent/loop.js'
import { testSumoPodPing, getModel } from './lib/openai.js'
import { formatAgentError } from './lib/errors.js'
import { getQuote, searchSymbols, getHistorical } from './lib/yahoo.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT) || 3001

export const app = express()

app.use(cors({ origin: true }))
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'vnansial-api',
    sumopod: Boolean(process.env.SUMOPOD_API_KEY),
    model: getModel(),
  })
})

app.get('/api/agent/test', async (_req, res) => {
  const result = await testSumoPodPing()
  res.status(result.ok ? 200 : 503).json(result)
})

app.get('/api/market/quote', async (req, res) => {
  const symbol = req.query.symbol
  const result = await getQuote(symbol)
  res.status(result.error ? 404 : 200).json(result)
})

app.get('/api/market/search', async (req, res) => {
  const q = req.query.q || req.query.query
  const result = await searchSymbols(q)
  res.json(result)
})

app.get('/api/market/history', async (req, res) => {
  const symbol = req.query.symbol
  const range = req.query.range || '3mo'
  const result = await getHistorical(symbol, range)
  res.status(result.error && !result.points?.length ? 404 : 200).json(result)
})

app.post('/api/agent/chat', async (req, res) => {
  try {
    const { messages } = req.body
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array required' })
    }

    const sanitized = messages
      .filter(m => m && (m.role === 'user' || m.role === 'assistant'))
      .slice(-20)
      .map(m => ({ role: m.role, content: String(m.content || '').slice(0, 4000) }))

    const result = await runAgentChat(sanitized)
    res.json(result)
  } catch (err) {
    console.error('[agent/chat]', err)
    const formatted = formatAgentError(err)
    res.status(formatted.code === 'missing_api_key' ? 503 : 502).json(formatted)
  }
})

const distPath = path.join(__dirname, '..', 'dist')
app.use(express.static(distPath))
app.get(/^\/(?!api).*/, (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'), err => {
    if (err) res.status(404).end()
  })
})

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])

if (isMain) {
  app.listen(PORT, () => {
    console.log(`Vnansial API http://localhost:${PORT}`)
    console.log(`  Model:   ${getModel()}`)
    console.log(`  SumoPod: ${process.env.SUMOPOD_API_KEY ? 'configured' : 'MISSING'}`)
  })
}
