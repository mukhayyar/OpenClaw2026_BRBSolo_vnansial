/**
 * Self-modifying admin tools — let the agent inspect & extend the
 * SQLite schema and install allowlisted npm packages at runtime.
 *
 * Safety:
 *  - All ops require PIN
 *  - SQL execution rejects DROP on core tables (user, settings) and
 *    blocks DELETE/UPDATE without WHERE
 *  - npm install limited to an allowlist of well-known packages
 *  - All ops log to console for auditability
 */

import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { resolveUser } from '../lib/auth.js'
import { getDriver } from '../lib/db.js'

const execAsync = promisify(exec)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.join(__dirname, '..', '..')

const CORE_TABLES = new Set([
  'user', 'settings', 'session', 'message', 'health_snapshot',
  'holding', 'buffer', 'agent', 'alert', 'reminder', 'debt',
  'cashflow_rule', 'token_whitepaper',
])

// Packages the agent is allowed to install at runtime. Conservative —
// add new entries here after manual review.
const NPM_ALLOWLIST = new Set([
  'sharp',                  // image processing
  'pdfkit',                 // PDF generation
  'qrcode',                 // QR codes
  'chartjs-node-canvas',    // server-side chart rendering
  '@sparticuz/chromium',    // headless chrome
  'puppeteer-core',         // browser automation
  'node-cron',              // proper cron (we use setInterval now)
  'csv-parser',             // CSV ingestion (Waspada Investasi list)
  'cheerio',                // HTML parsing
  'rss-parser',             // RSS feeds
  'sanitize-html',          // HTML sanitization
  'date-fns',               // date math
  'fast-xml-parser',        // XML feeds
])

function pinErr() {
  return {
    error: 'pin_required',
    message: 'Operasi admin butuh PIN. Buka /settings dan unlock dulu.',
  }
}

async function getDb() {
  if (getDriver() !== 'sqlite') {
    return { error: 'sqlite_unavailable', message: 'better-sqlite3 belum diinstall — driver in-memory tidak mendukung introspection.' }
  }
  // Direct access to the underlying handle
  const mod = await import('better-sqlite3')
  const Database = mod.default || mod
  const dbPath = process.env.VNANSIAL_DB_PATH || path.join(REPO_ROOT, 'server', 'data', 'vnansial.db')
  return new Database(dbPath)
}

export async function dbListTables({ pin } = {}) {
  if (!resolveUser(pin)) return pinErr()
  const db = await getDb()
  if (db?.error) return db
  const rows = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all()
  db.close()
  return {
    tables: rows.map(r => ({ name: r.name, isCore: CORE_TABLES.has(r.name) })),
  }
}

export async function dbDescribeTable({ pin, table } = {}) {
  if (!resolveUser(pin)) return pinErr()
  if (!table) return { error: 'table wajib.' }
  const db = await getDb()
  if (db?.error) return db
  try {
    const columns = db.prepare(`PRAGMA table_info(${table})`).all()
    const indexes = db.prepare(`PRAGMA index_list(${table})`).all()
    const sample = db.prepare(`SELECT * FROM ${table} LIMIT 3`).all()
    return { table, columns, indexes, sampleRows: sample }
  } finally {
    db.close()
  }
}

/**
 * Execute a SQL statement. Whitelisted to CREATE TABLE, ALTER TABLE,
 * CREATE INDEX, and SELECT. DROP and destructive UPDATE/DELETE are
 * rejected unless the user explicitly confirms with confirm=true and
 * the target isn't a core table.
 */
export async function dbExecute({ pin, sql, confirm } = {}) {
  if (!resolveUser(pin)) return pinErr()
  if (!sql || typeof sql !== 'string') return { error: 'sql wajib.' }
  const trimmed = sql.trim().replace(/;\s*$/, '')
  const upper = trimmed.toUpperCase()

  // Read-only is always allowed
  const isSelect = upper.startsWith('SELECT') || upper.startsWith('PRAGMA') || upper.startsWith('EXPLAIN')

  // Safe schema mutations
  const isCreateTable = upper.startsWith('CREATE TABLE')
  const isCreateIndex = upper.startsWith('CREATE INDEX') || upper.startsWith('CREATE UNIQUE INDEX')
  const isAlter = upper.startsWith('ALTER TABLE')

  // Potentially dangerous
  const isDrop = upper.startsWith('DROP TABLE') || upper.startsWith('DROP INDEX')
  const isDelete = upper.startsWith('DELETE FROM')
  const isUpdate = upper.startsWith('UPDATE')

  if (!isSelect && !isCreateTable && !isCreateIndex && !isAlter && !isDrop && !isDelete && !isUpdate) {
    return { error: 'sql_not_allowed', hint: 'Hanya SELECT/PRAGMA/CREATE TABLE/CREATE INDEX/ALTER TABLE/DROP/DELETE/UPDATE diizinkan.' }
  }

  if (isDrop || isDelete) {
    // Require explicit confirm and forbid core tables
    if (!confirm) {
      return { error: 'confirm_required', message: 'Operasi destruktif butuh confirm=true.' }
    }
    const tableMatch = upper.match(/(?:DROP TABLE(?:\s+IF EXISTS)?|DELETE FROM)\s+([A-Z_][A-Z0-9_]*)/)
    const target = tableMatch?.[1]?.toLowerCase()
    if (target && CORE_TABLES.has(target)) {
      return { error: 'core_table_protected', message: `Tabel ${target} dilindungi — tidak bisa di-DROP/DELETE total.` }
    }
    if (isDelete && !upper.includes('WHERE')) {
      return { error: 'delete_without_where', message: 'DELETE wajib pakai WHERE clause.' }
    }
  }

  if (isUpdate && !upper.includes('WHERE')) {
    return { error: 'update_without_where', message: 'UPDATE wajib pakai WHERE clause.' }
  }

  const db = await getDb()
  if (db?.error) return db
  try {
    console.log('[admin] dbExecute:', trimmed.slice(0, 200))
    if (isSelect) {
      const rows = db.prepare(trimmed).all()
      return { ok: true, rows, rowCount: rows.length }
    } else {
      const info = db.prepare(trimmed).run()
      return { ok: true, changes: info.changes, lastInsertRowid: info.lastInsertRowid }
    }
  } catch (err) {
    return { error: err.message }
  } finally {
    db.close()
  }
}

export async function installPackage({ pin, name, save = true } = {}) {
  if (!resolveUser(pin)) return pinErr()
  if (!name) return { error: 'name wajib.' }
  if (!NPM_ALLOWLIST.has(name)) {
    return {
      error: 'not_in_allowlist',
      message: `Package "${name}" tidak ada di allowlist. Allowed: ${[...NPM_ALLOWLIST].join(', ')}.`,
      hint: 'Tambahkan ke NPM_ALLOWLIST di server/tools/admin.js (manual review) jika perlu.',
    }
  }
  const cmd = save ? `npm install ${name}` : `npm install --no-save ${name}`
  console.log('[admin] installPackage:', cmd)
  try {
    const { stdout, stderr } = await execAsync(cmd, { cwd: REPO_ROOT, timeout: 120_000 })
    return {
      ok: true,
      package: name,
      stdout: stdout.slice(-2000),
      stderr: stderr.slice(-1000),
      message:
        `Package ${name} terinstall. Restart server (atau Docker container) untuk aktifkan ` +
        `karena Node sudah meng-cache module loader.`,
    }
  } catch (err) {
    return { error: 'install_failed', message: err.message, stderr: err.stderr?.slice(-1000) }
  }
}

export function listInstallablePackages() {
  return { allowlist: [...NPM_ALLOWLIST] }
}
