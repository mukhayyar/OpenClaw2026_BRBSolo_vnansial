import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { runAgentChat } from './agent/loop.js'
import { isReplizConfigured } from './lib/repliz.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT) || 3001
const app = express()

app.use(cors({ origin: true }))
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'vnansial-api',
    sumopod: Boolean(process.env.SUMOPOD_API_KEY),
    repliz: isReplizConfigured(),
  })
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
    console.error('[agent]', err)
    res.status(500).json({
      error: err.message || 'Agent error',
      hint: err.message?.includes('SUMOPOD') ? 'Set SUMOPOD_API_KEY in .env' : undefined,
    })
  }
})

const distPath = path.join(__dirname, '..', 'dist')
app.use(express.static(distPath))
app.get(/^\/(?!api).*/, (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

app.listen(PORT, () => {
  console.log(`Vnansial API http://localhost:${PORT}`)
  console.log(`  SumoPod: ${process.env.SUMOPOD_API_KEY ? 'configured' : 'MISSING'}`)
  console.log(`  Repliz:  ${isReplizConfigured() ? 'configured' : 'optional'}`)
})
