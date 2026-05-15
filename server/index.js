import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { runAgentChat } from './agent/loop.js'
import { testSumoPodPing, getModel } from './lib/openai.js'
import { formatAgentError } from './lib/errors.js'
import { getQuote, searchSymbols, getHistorical } from './lib/yahoo.js'
import { scoreFinancialHealth } from './tools/health.js'
import {
  getCompanyOverview,
  getCompanyProfile,
  getFinancialReport,
  getDividenTunai,
  getDividenSaham,
  getESG,
  getPemegangSaham,
  getCalendar,
  listAllEmiten,
} from './lib/idx.js'
import { getTopCoins, getCoinDetail, assessCryptoRisk, searchCoins, getCoinHistory } from './lib/coingecko.js'
import {
  listInsuranceCompanies,
  getInsuranceCompany,
  calculatePremium,
  recommendInsurance,
} from './lib/insurance.js'
import {
  ensureUser,
  saveHealthSnapshot,
  listHealthSnapshots,
  upsertHolding,
  deleteHolding,
  listHoldings,
  upsertBuffer,
  listBuffers,
  getDriver,
  createSession,
  listSessions,
  getSession,
  renameSession,
  deleteSession,
  appendMessage,
  listMessages,
  listCustomAgents,
  upsertCustomAgent,
  deleteCustomAgent,
  getSettings,
  saveSettings,
  listAlerts,
  createAlert,
  deleteAlert,
} from './lib/db.js'
import { requirePin, HAS_PIN } from './lib/auth.js'
import { AGENT_PRESETS, findAgent } from './agent/presets.js'
import { startTelegram } from './integrations/telegram.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT) || 3001

export const app = express()

app.use(cors({ origin: true }))
app.use(express.json({ limit: '1mb' }))

// ----- Health & meta --------------------------------------------------------
app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'vnansial-api',
    sumopod: Boolean(process.env.SUMOPOD_API_KEY),
    model: getModel(),
    db: getDriver(),
    telegram: Boolean(process.env.TELEGRAM_BOT_TOKEN),
    pinProtected: HAS_PIN,
  })
})

app.get('/api/agent/test', async (_req, res) => {
  const result = await testSumoPodPing()
  res.status(result.ok ? 200 : 503).json(result)
})

// ----- Yahoo Finance --------------------------------------------------------
app.get('/api/market/quote', async (req, res) => {
  const result = await getQuote(req.query.symbol)
  res.status(result.error ? 404 : 200).json(result)
})

app.get('/api/market/search', async (req, res) => {
  const result = await searchSymbols(req.query.q || req.query.query)
  res.json(result)
})

app.get('/api/market/history', async (req, res) => {
  const result = await getHistorical(req.query.symbol, req.query.range || '3mo')
  res.status(result.error && !result.points?.length ? 404 : 200).json(result)
})

// ----- IDX ------------------------------------------------------------------
// ----- Scam check ----------------------------------------------------------
app.get('/api/scam/rekening', async (req, res) => {
  const { default: m } = await import('./lib/scamCheck.js')
    .then(mod => ({ default: mod }))
    .catch(() => ({ default: null }))
  if (!m) return res.status(500).json({ error: 'scam module load failed' })
  res.json(await m.checkBankAccount({ accountNumber: req.query.account, bankCode: req.query.bank }))
})

app.get('/api/scam/nomor', async (req, res) => {
  const { default: m } = await import('./lib/scamCheck.js')
    .then(mod => ({ default: mod }))
    .catch(() => ({ default: null }))
  if (!m) return res.status(500).json({ error: 'scam module load failed' })
  res.json(await m.checkPhoneNumber({ phone: req.query.phone || req.query.q }))
})

app.get('/api/idx/emiten', async (_req, res) => {
  res.json(await listAllEmiten())
})

app.get('/api/idx/calendar/:code', async (req, res) => {
  res.json(await getCalendar(req.params.code, req.query.date))
})

app.get('/api/idx/profile/:code', async (req, res) => {
  res.json(await getCompanyProfile(req.params.code))
})

app.get('/api/idx/dividen/:code', async (req, res) => {
  const year = Number(req.query.year) || new Date().getUTCFullYear()
  const [tunai, saham] = await Promise.all([getDividenTunai(req.params.code, year), getDividenSaham(req.params.code, year)])
  res.json({ year, tunai, saham })
})

app.get('/api/idx/financial/:code', async (req, res) => {
  const periode = req.query.periode || 'audit'
  const year = Number(req.query.year) || new Date().getUTCFullYear()
  res.json(await getFinancialReport(req.params.code, periode, year))
})

app.get('/api/idx/esg/:code', async (req, res) => {
  const year = Number(req.query.year) || new Date().getUTCFullYear()
  res.json(await getESG(req.params.code, year))
})

app.get('/api/idx/pemegang/:code', async (req, res) => {
  const year = Number(req.query.year) || new Date().getUTCFullYear()
  res.json(await getPemegangSaham(req.params.code, year))
})

app.get('/api/idx/:code', async (req, res) => {
  const data = await getCompanyOverview(req.params.code)
  res.json(data)
})

// ----- Crypto ---------------------------------------------------------------
app.get('/api/crypto/top', async (req, res) => {
  res.json(await getTopCoins(Number(req.query.limit) || 50))
})

app.get('/api/crypto/coin', async (req, res) => {
  res.json(await getCoinDetail(req.query.id))
})

app.get('/api/crypto/risk', async (req, res) => {
  res.json(await assessCryptoRisk(req.query.id))
})

app.get('/api/crypto/search', async (req, res) => {
  res.json(await searchCoins(req.query.q || req.query.query))
})

app.get('/api/crypto/history', async (req, res) => {
  res.json(await getCoinHistory(req.query.id, Number(req.query.days) || 90))
})

// ----- Insurance ------------------------------------------------------------
app.get('/api/insurance', (req, res) => {
  res.json(listInsuranceCompanies(req.query.type))
})

app.get('/api/insurance/:id', (req, res) => {
  res.json(getInsuranceCompany(req.params.id))
})

app.post('/api/insurance/premium', (req, res) => {
  res.json(calculatePremium(req.body || {}))
})

app.post('/api/insurance/recommend', (req, res) => {
  res.json(recommendInsurance(req.body || {}))
})

// ----- Health score & persistence ------------------------------------------
app.post('/api/health/score', (req, res) => {
  const result = scoreFinancialHealth(req.body || {})
  res.status(result.error ? 400 : 200).json(result)
})

app.post('/api/me/auth/check', (req, res) => {
  const pin = req.headers['x-vnansial-pin'] || req.body?.pin
  if (!HAS_PIN) return res.json({ ok: true, mode: 'open' })
  if (!pin || String(pin) !== String(process.env.VNANSIAL_PIN)) {
    return res.status(401).json({ ok: false, error: 'pin_mismatch' })
  }
  res.json({ ok: true, mode: 'pin' })
})

app.post('/api/me/health', requirePin, (req, res) => {
  const result = scoreFinancialHealth(req.body || {})
  if (result.error) return res.status(400).json(result)
  const snap = saveHealthSnapshot({ userId: req.user.id, score: result.score, payload: { input: req.body, result } })
  res.json({ user: req.user, snapshot: snap, result })
})

app.get('/api/me/health/history', requirePin, (req, res) => {
  res.json({ user: req.user, snapshots: listHealthSnapshots(req.user.id) })
})

// ----- Portfolio persistence -----------------------------------------------
app.get('/api/me/portfolio', requirePin, (req, res) => {
  res.json({
    user: req.user,
    holdings: listHoldings(req.user.id),
    buffers: listBuffers(req.user.id),
  })
})

app.post('/api/me/portfolio/holding', requirePin, (req, res) => {
  const { kind, symbol, amount, costBasis } = req.body || {}
  if (!kind || !symbol || !Number.isFinite(Number(amount))) {
    return res.status(400).json({ error: 'kind, symbol, amount required' })
  }
  const row = upsertHolding({ userId: req.user.id, kind, symbol: String(symbol).toUpperCase(), amount: Number(amount), costBasis: Number(costBasis) || null })
  res.json(row)
})

app.delete('/api/me/portfolio/holding', requirePin, (req, res) => {
  const { kind, symbol } = req.body || {}
  deleteHolding({ userId: req.user.id, kind, symbol: String(symbol).toUpperCase() })
  res.json({ ok: true })
})

app.post('/api/me/portfolio/buffer', requirePin, (req, res) => {
  const { kind, amount, target } = req.body || {}
  if (!kind) return res.status(400).json({ error: 'kind required' })
  res.json(upsertBuffer({ userId: req.user.id, kind, amount: Number(amount) || 0, target: Number(target) || null }))
})

// ----- Agent chat -----------------------------------------------------------
app.post('/api/agent/chat', async (req, res) => {
  try {
    const { messages, pin, agentId, sessionId } = req.body
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array required' })
    }
    const sanitized = messages
      .filter(m => m && (m.role === 'user' || m.role === 'assistant'))
      .slice(-30)
      .map(m => ({ role: m.role, content: String(m.content || '').slice(0, 4000) }))
    const pinFromHeader = req.headers['x-vnansial-pin']
    const effectivePin = pin || pinFromHeader || null

    // Resolve agent: preset first, then custom (PIN-gated)
    let agent = findAgent(agentId || 'generalis')
    if (effectivePin && agentId) {
      const user = ensureUser({ nickname: 'self' })
      const custom = listCustomAgents(user.id).find(a => a.id === agentId)
      if (custom) agent = custom
    }

    const result = await runAgentChat(sanitized, { pin: effectivePin, agent })

    // Persist into session if provided
    if (sessionId && effectivePin) {
      const user = ensureUser({ nickname: 'self' })
      const s = getSession(sessionId)
      if (s && s.user_id === user.id) {
        const lastUser = sanitized[sanitized.length - 1]
        if (lastUser && lastUser.role === 'user') {
          appendMessage({ sessionId: s.id, role: 'user', content: lastUser.content })
        }
        appendMessage({ sessionId: s.id, role: 'assistant', content: result.message, toolCalls: result.toolCalls })
      }
    }

    res.json(result)
  } catch (err) {
    console.error('[agent/chat]', err)
    const formatted = formatAgentError(err)
    res.status(formatted.code === 'missing_api_key' ? 503 : 502).json(formatted)
  }
})

// ----- Agents ----------------------------------------------------
app.get('/api/agents', (req, res) => {
  // Presets are public; custom agents need PIN
  const pin = req.headers['x-vnansial-pin']
  const presets = AGENT_PRESETS.map(a => ({ id: a.id, name: a.name, description: a.description, tools: a.tools, kind: 'preset' }))
  if (!HAS_PIN || (pin && String(pin) === String(process.env.VNANSIAL_PIN))) {
    const user = ensureUser({ nickname: 'self' })
    const custom = listCustomAgents(user.id).map(a => ({ ...a, kind: 'custom' }))
    return res.json({ presets, custom })
  }
  res.json({ presets, custom: [] })
})

app.post('/api/agents', requirePin, (req, res) => {
  const { id, name, description, prompt, tools } = req.body || {}
  if (!name || !prompt) return res.status(400).json({ error: 'name & prompt required' })
  const row = upsertCustomAgent({ id, userId: req.user.id, name, description, prompt, tools: tools || null })
  res.json(row)
})

app.delete('/api/agents/:id', requirePin, (req, res) => {
  deleteCustomAgent(req.params.id)
  res.json({ ok: true })
})

// ----- Sessions --------------------------------------------------
app.get('/api/sessions', requirePin, (req, res) => {
  res.json({ sessions: listSessions(req.user.id) })
})

app.post('/api/sessions', requirePin, (req, res) => {
  const { title = 'Sesi baru', agentId = 'generalis' } = req.body || {}
  res.json(createSession({ userId: req.user.id, title, agentId }))
})

app.patch('/api/sessions/:id', requirePin, (req, res) => {
  const { title } = req.body || {}
  if (title) renameSession(req.params.id, title)
  res.json({ ok: true })
})

app.delete('/api/sessions/:id', requirePin, (req, res) => {
  deleteSession(req.params.id)
  res.json({ ok: true })
})

app.get('/api/sessions/:id/messages', requirePin, (req, res) => {
  const s = getSession(req.params.id)
  if (!s || s.user_id !== req.user.id) return res.status(404).json({ error: 'session not found' })
  res.json({ session: s, messages: listMessages(s.id) })
})

app.get('/api/sessions/:id/export', requirePin, (req, res) => {
  const s = getSession(req.params.id)
  if (!s || s.user_id !== req.user.id) return res.status(404).json({ error: 'session not found' })
  const msgs = listMessages(s.id)
  const lines = [
    `# ${s.title}`,
    `Agent: ${s.agent_id}`,
    `Created: ${new Date(s.created_at).toISOString()}`,
    '',
  ]
  for (const m of msgs) {
    const ts = new Date(m.created_at).toISOString()
    lines.push(`## ${m.role.toUpperCase()} · ${ts}`)
    lines.push('')
    lines.push(m.content)
    if (m.tool_calls) {
      lines.push('')
      lines.push('```json')
      lines.push(JSON.stringify(m.tool_calls, null, 2))
      lines.push('```')
    }
    lines.push('')
  }
  res.setHeader('Content-Type', 'text/markdown; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename="vnansial-session-${s.id}.md"`)
  res.send(lines.join('\n'))
})

// ----- Settings --------------------------------------------------
app.get('/api/me/settings', requirePin, (req, res) => {
  const s = getSettings(req.user.id) || { user_id: req.user.id, telegram_chat_id: null, default_agent_id: 'generalis' }
  res.json({
    user: req.user,
    settings: s,
    telegramConfigured: Boolean(process.env.TELEGRAM_BOT_TOKEN),
    telegramTokenMasked: process.env.TELEGRAM_BOT_TOKEN
      ? `${String(process.env.TELEGRAM_BOT_TOKEN).slice(0, 6)}${'•'.repeat(20)}${String(process.env.TELEGRAM_BOT_TOKEN).slice(-4)}`
      : null,
    pinProtected: HAS_PIN,
  })
})

app.post('/api/me/settings', requirePin, (req, res) => {
  const { telegramChatId, defaultAgentId } = req.body || {}
  const row = saveSettings({ userId: req.user.id, telegramChatId, defaultAgentId })
  res.json(row)
})

// ----- Alerts ----------------------------------------------------
app.get('/api/me/alerts', requirePin, (req, res) => {
  res.json({ alerts: listAlerts(req.user.id) })
})

app.post('/api/me/alerts', requirePin, (req, res) => {
  const { kind, symbol, condition, target } = req.body || {}
  if (!kind || !symbol || !condition || !Number.isFinite(Number(target))) {
    return res.status(400).json({ error: 'kind, symbol, condition (above|below), target required' })
  }
  res.json(createAlert({ userId: req.user.id, kind, symbol, condition, target: Number(target) }))
})

app.delete('/api/me/alerts/:id', requirePin, (req, res) => {
  deleteAlert(req.params.id)
  res.json({ ok: true })
})

// ----- Static --------------------------------------------------------------
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
    console.log(`  Model:    ${getModel()}`)
    console.log(`  SumoPod:  ${process.env.SUMOPOD_API_KEY ? 'configured' : 'MISSING'}`)
    console.log(`  DB:       ${getDriver()}`)
    if (process.env.TELEGRAM_BOT_TOKEN) startTelegram()
  })
}
