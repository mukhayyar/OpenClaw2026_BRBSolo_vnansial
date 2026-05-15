/**
 * SQLite layer (better-sqlite3, optional).
 *
 * Why optional: better-sqlite3 needs native compilation. If it's not
 * installed (e.g. CI minimal install), we gracefully fall back to an
 * in-memory Map and warn at startup. Production self-hosters should
 * `npm install better-sqlite3`.
 *
 * Tables:
 *   user(id PRIMARY KEY, telegram_chat_id UNIQUE, created_at)
 *   health_snapshot(id PK, user_id, score, payload_json, created_at)
 *   holding(id PK, user_id, kind, symbol, amount, cost_basis, created_at)
 *   buffer(id PK, user_id, kind, amount, target, updated_at)
 *
 * All write functions are idempotent and accept JS values; reads always
 * return plain JS objects.
 */

import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = process.env.VNANSIAL_DB_PATH || path.join(__dirname, '..', 'data', 'vnansial.db')

let db = null
let driver = 'memory'
const mem = new Map()
let memSeq = 1

async function tryLoadSqlite() {
  try {
    const mod = await import('better-sqlite3')
    const Database = mod.default || mod
    db = new Database(DB_PATH)
    db.pragma('journal_mode = WAL')
    driver = 'sqlite'
    db.exec(`
      CREATE TABLE IF NOT EXISTS user (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        telegram_chat_id TEXT UNIQUE,
        nickname TEXT,
        created_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS health_snapshot (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        score INTEGER NOT NULL,
        payload TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS holding (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        kind TEXT NOT NULL,
        symbol TEXT NOT NULL,
        amount REAL NOT NULL,
        cost_basis REAL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS buffer (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        kind TEXT NOT NULL,
        amount REAL NOT NULL,
        target REAL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_health_user ON health_snapshot(user_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_holding_user ON holding(user_id);
      CREATE INDEX IF NOT EXISTS idx_buffer_user ON buffer(user_id);
      CREATE TABLE IF NOT EXISTS session (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        agent_id TEXT NOT NULL DEFAULT 'generalis',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS message (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        tool_calls TEXT,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (session_id) REFERENCES session(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS agent (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        prompt TEXT NOT NULL,
        tools TEXT,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS settings (
        user_id INTEGER PRIMARY KEY,
        telegram_chat_id TEXT,
        default_agent_id TEXT DEFAULT 'generalis',
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS alert (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        kind TEXT NOT NULL,
        symbol TEXT NOT NULL,
        condition TEXT NOT NULL,
        target REAL NOT NULL,
        active INTEGER NOT NULL DEFAULT 1,
        last_fired_at INTEGER,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_session_user ON session(user_id, updated_at DESC);
      CREATE INDEX IF NOT EXISTS idx_message_session ON message(session_id, id);
      CREATE INDEX IF NOT EXISTS idx_agent_user ON agent(user_id);
      CREATE INDEX IF NOT EXISTS idx_alert_user ON alert(user_id, active);
    `)
    return true
  } catch (err) {
    console.warn(
      '[db] better-sqlite3 not available — running in memory mode.',
      err.code === 'ERR_MODULE_NOT_FOUND'
        ? 'Install with `npm install better-sqlite3` for persistence.'
        : err.message,
    )
    return false
  }
}

await tryLoadSqlite()

function now() {
  return Date.now()
}

function memInsert(table, row) {
  if (!mem.has(table)) mem.set(table, new Map())
  const id = memSeq++
  const stored = { id, ...row }
  mem.get(table).set(id, stored)
  return stored
}

function memList(table) {
  if (!mem.has(table)) return []
  return [...mem.get(table).values()]
}

export function getDriver() {
  return driver
}

export function isPersistent() {
  return driver === 'sqlite'
}

// Users -----------------------------------------------------------
export function ensureUser({ telegramChatId = null, nickname = null } = {}) {
  if (driver === 'sqlite') {
    if (telegramChatId) {
      const existing = db
        .prepare('SELECT * FROM user WHERE telegram_chat_id = ?')
        .get(String(telegramChatId))
      if (existing) return existing
    }
    const stmt = db.prepare(
      'INSERT INTO user (telegram_chat_id, nickname, created_at) VALUES (?, ?, ?)',
    )
    const info = stmt.run(telegramChatId ? String(telegramChatId) : null, nickname, now())
    return db.prepare('SELECT * FROM user WHERE id = ?').get(info.lastInsertRowid)
  }
  if (telegramChatId) {
    const found = memList('user').find(u => u.telegram_chat_id === String(telegramChatId))
    if (found) return found
  }
  return memInsert('user', {
    telegram_chat_id: telegramChatId ? String(telegramChatId) : null,
    nickname,
    created_at: now(),
  })
}

export function findUserByTelegram(chatId) {
  if (driver === 'sqlite') {
    return db.prepare('SELECT * FROM user WHERE telegram_chat_id = ?').get(String(chatId))
  }
  return memList('user').find(u => u.telegram_chat_id === String(chatId)) || null
}

// Health snapshots ------------------------------------------------
export function saveHealthSnapshot({ userId, score, payload }) {
  const row = {
    user_id: userId,
    score,
    payload: JSON.stringify(payload || {}),
    created_at: now(),
  }
  if (driver === 'sqlite') {
    const info = db
      .prepare('INSERT INTO health_snapshot (user_id, score, payload, created_at) VALUES (?, ?, ?, ?)')
      .run(row.user_id, row.score, row.payload, row.created_at)
    return { id: info.lastInsertRowid, ...row }
  }
  return memInsert('health_snapshot', row)
}

export function listHealthSnapshots(userId, limit = 20) {
  if (driver === 'sqlite') {
    return db
      .prepare(
        'SELECT * FROM health_snapshot WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
      )
      .all(userId, limit)
      .map(r => ({ ...r, payload: safeParse(r.payload) }))
  }
  return memList('health_snapshot')
    .filter(r => r.user_id === userId)
    .sort((a, b) => b.created_at - a.created_at)
    .slice(0, limit)
    .map(r => ({ ...r, payload: safeParse(r.payload) }))
}

// Holdings --------------------------------------------------------
export function upsertHolding({ userId, kind, symbol, amount, costBasis }) {
  if (driver === 'sqlite') {
    db.prepare(
      'DELETE FROM holding WHERE user_id = ? AND kind = ? AND symbol = ?',
    ).run(userId, kind, symbol)
    const info = db
      .prepare(
        'INSERT INTO holding (user_id, kind, symbol, amount, cost_basis, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      )
      .run(userId, kind, symbol, amount, costBasis ?? null, now())
    return { id: info.lastInsertRowid, user_id: userId, kind, symbol, amount, cost_basis: costBasis, created_at: now() }
  }
  const list = mem.get('holding') || new Map()
  for (const [k, v] of list) {
    if (v.user_id === userId && v.kind === kind && v.symbol === symbol) list.delete(k)
  }
  return memInsert('holding', { user_id: userId, kind, symbol, amount, cost_basis: costBasis ?? null, created_at: now() })
}

export function deleteHolding({ userId, kind, symbol }) {
  if (driver === 'sqlite') {
    db.prepare('DELETE FROM holding WHERE user_id = ? AND kind = ? AND symbol = ?').run(userId, kind, symbol)
    return true
  }
  const list = mem.get('holding')
  if (!list) return false
  for (const [k, v] of list) {
    if (v.user_id === userId && v.kind === kind && v.symbol === symbol) list.delete(k)
  }
  return true
}

export function listHoldings(userId) {
  if (driver === 'sqlite') {
    return db.prepare('SELECT * FROM holding WHERE user_id = ?').all(userId)
  }
  return memList('holding').filter(r => r.user_id === userId)
}

// Buffers (emergency fund, money buffer) --------------------------
export function upsertBuffer({ userId, kind, amount, target }) {
  if (driver === 'sqlite') {
    const existing = db
      .prepare('SELECT id FROM buffer WHERE user_id = ? AND kind = ?')
      .get(userId, kind)
    if (existing) {
      db.prepare('UPDATE buffer SET amount = ?, target = ?, updated_at = ? WHERE id = ?')
        .run(amount, target ?? null, now(), existing.id)
      return { id: existing.id, user_id: userId, kind, amount, target, updated_at: now() }
    }
    const info = db
      .prepare('INSERT INTO buffer (user_id, kind, amount, target, updated_at) VALUES (?, ?, ?, ?, ?)')
      .run(userId, kind, amount, target ?? null, now())
    return { id: info.lastInsertRowid, user_id: userId, kind, amount, target, updated_at: now() }
  }
  const list = mem.get('buffer') || new Map()
  for (const [k, v] of list) {
    if (v.user_id === userId && v.kind === kind) list.delete(k)
  }
  return memInsert('buffer', { user_id: userId, kind, amount, target: target ?? null, updated_at: now() })
}

export function listBuffers(userId) {
  if (driver === 'sqlite') {
    return db.prepare('SELECT * FROM buffer WHERE user_id = ?').all(userId)
  }
  return memList('buffer').filter(r => r.user_id === userId)
}

function safeParse(s) {
  try {
    return JSON.parse(s)
  } catch {
    return null
  }
}

// Sessions ---------------------------------------------------------
export function createSession({ userId, title, agentId = 'generalis' }) {
  const t = now()
  if (driver === 'sqlite') {
    const info = db
      .prepare('INSERT INTO session (user_id, title, agent_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?)')
      .run(userId, title, agentId, t, t)
    return { id: info.lastInsertRowid, user_id: userId, title, agent_id: agentId, created_at: t, updated_at: t }
  }
  return memInsert('session', { user_id: userId, title, agent_id: agentId, created_at: t, updated_at: t })
}

export function listSessions(userId, limit = 30) {
  if (driver === 'sqlite') {
    return db.prepare('SELECT * FROM session WHERE user_id = ? ORDER BY updated_at DESC LIMIT ?').all(userId, limit)
  }
  return memList('session').filter(s => s.user_id === userId).sort((a, b) => b.updated_at - a.updated_at).slice(0, limit)
}

export function getSession(id) {
  if (driver === 'sqlite') return db.prepare('SELECT * FROM session WHERE id = ?').get(id)
  return memList('session').find(s => s.id === Number(id)) || null
}

export function renameSession(id, title) {
  if (driver === 'sqlite') {
    db.prepare('UPDATE session SET title = ?, updated_at = ? WHERE id = ?').run(title, now(), id)
    return true
  }
  const s = memList('session').find(x => x.id === Number(id))
  if (s) {
    s.title = title
    s.updated_at = now()
  }
  return Boolean(s)
}

export function deleteSession(id) {
  if (driver === 'sqlite') {
    db.prepare('DELETE FROM session WHERE id = ?').run(id)
    return true
  }
  const m = mem.get('session')
  if (m) m.delete(Number(id))
  return true
}

export function appendMessage({ sessionId, role, content, toolCalls = null }) {
  const t = now()
  const tc = toolCalls ? JSON.stringify(toolCalls) : null
  if (driver === 'sqlite') {
    db.prepare('INSERT INTO message (session_id, role, content, tool_calls, created_at) VALUES (?, ?, ?, ?, ?)').run(sessionId, role, content, tc, t)
    db.prepare('UPDATE session SET updated_at = ? WHERE id = ?').run(t, sessionId)
  } else {
    memInsert('message', { session_id: sessionId, role, content, tool_calls: tc, created_at: t })
    const s = memList('session').find(x => x.id === sessionId)
    if (s) s.updated_at = t
  }
}

export function listMessages(sessionId) {
  if (driver === 'sqlite') {
    return db.prepare('SELECT * FROM message WHERE session_id = ? ORDER BY id').all(sessionId).map(r => ({
      ...r,
      tool_calls: r.tool_calls ? safeParse(r.tool_calls) : null,
    }))
  }
  return memList('message')
    .filter(m => m.session_id === sessionId)
    .sort((a, b) => a.id - b.id)
    .map(r => ({ ...r, tool_calls: r.tool_calls ? safeParse(r.tool_calls) : null }))
}

// Custom user agents ----------------------------------------------
export function listCustomAgents(userId) {
  if (driver === 'sqlite') {
    return db.prepare('SELECT * FROM agent WHERE user_id = ?').all(userId).map(a => ({
      ...a,
      tools: a.tools ? safeParse(a.tools) : null,
    }))
  }
  return memList('agent').filter(a => a.user_id === userId).map(a => ({
    ...a,
    tools: a.tools ? safeParse(a.tools) : null,
  }))
}

export function upsertCustomAgent({ id, userId, name, description, prompt, tools }) {
  const t = now()
  const toolsStr = tools ? JSON.stringify(tools) : null
  const aid = id || `custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`
  if (driver === 'sqlite') {
    db.prepare(`
      INSERT INTO agent (id, user_id, name, description, prompt, tools, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET name=excluded.name, description=excluded.description, prompt=excluded.prompt, tools=excluded.tools
    `).run(aid, userId, name, description || null, prompt, toolsStr, t)
    return db.prepare('SELECT * FROM agent WHERE id = ?').get(aid)
  }
  const list = mem.get('agent') || new Map()
  for (const [k, v] of list) if (v.id === aid) list.delete(k)
  return memInsert('agent', { id: aid, user_id: userId, name, description, prompt, tools: toolsStr, created_at: t })
}

export function deleteCustomAgent(id) {
  if (driver === 'sqlite') db.prepare('DELETE FROM agent WHERE id = ?').run(id)
  else {
    const m = mem.get('agent')
    if (m) for (const [k, v] of m) if (v.id === id) m.delete(k)
  }
  return true
}

// Settings ---------------------------------------------------------
export function getSettings(userId) {
  if (driver === 'sqlite') {
    return db.prepare('SELECT * FROM settings WHERE user_id = ?').get(userId) || null
  }
  return memList('settings').find(s => s.user_id === userId) || null
}

export function saveSettings({ userId, telegramChatId, defaultAgentId }) {
  const t = now()
  if (driver === 'sqlite') {
    db.prepare(`
      INSERT INTO settings (user_id, telegram_chat_id, default_agent_id, updated_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET telegram_chat_id=excluded.telegram_chat_id, default_agent_id=excluded.default_agent_id, updated_at=excluded.updated_at
    `).run(userId, telegramChatId || null, defaultAgentId || 'generalis', t)
    return db.prepare('SELECT * FROM settings WHERE user_id = ?').get(userId)
  }
  const list = mem.get('settings') || new Map()
  for (const [k, v] of list) if (v.user_id === userId) list.delete(k)
  return memInsert('settings', { user_id: userId, telegram_chat_id: telegramChatId || null, default_agent_id: defaultAgentId || 'generalis', updated_at: t })
}

// Alerts -----------------------------------------------------------
export function listAlerts(userId, activeOnly = false) {
  if (driver === 'sqlite') {
    const q = activeOnly
      ? 'SELECT * FROM alert WHERE user_id = ? AND active = 1'
      : 'SELECT * FROM alert WHERE user_id = ?'
    return db.prepare(q).all(userId)
  }
  return memList('alert').filter(a => a.user_id === userId && (!activeOnly || a.active))
}

export function createAlert({ userId, kind, symbol, condition, target }) {
  const t = now()
  if (driver === 'sqlite') {
    const info = db.prepare(
      'INSERT INTO alert (user_id, kind, symbol, condition, target, active, created_at) VALUES (?, ?, ?, ?, ?, 1, ?)',
    ).run(userId, kind, symbol, condition, target, t)
    return db.prepare('SELECT * FROM alert WHERE id = ?').get(info.lastInsertRowid)
  }
  return memInsert('alert', { user_id: userId, kind, symbol, condition, target, active: 1, last_fired_at: null, created_at: t })
}

export function deleteAlert(id) {
  if (driver === 'sqlite') db.prepare('DELETE FROM alert WHERE id = ?').run(id)
  else {
    const m = mem.get('alert')
    if (m) m.delete(Number(id))
  }
  return true
}

export function closeDb() {
  if (db) db.close()
}
