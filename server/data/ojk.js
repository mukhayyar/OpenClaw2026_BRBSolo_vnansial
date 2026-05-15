import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

function parseLine(line) {
  const result = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') { inQuotes = !inQuotes; continue }
    if (ch === ',' && !inQuotes) { result.push(current); current = ''; continue }
    current += ch
  }
  result.push(current)
  return result
}

function parseCSV(text) {
  const lines = text.split('\n').filter(l => l.trim())
  if (lines.length < 2) return []
  const headers = parseLine(lines[0])
  return lines.slice(1).map(line => {
    const vals = parseLine(line)
    const obj = {}
    headers.forEach((h, i) => { obj[h] = (vals[i] || '').trim() })
    return obj
  })
}

// Load 11K+ illegal entities from OJK Waspada Investasi Alert Portal
let OJK_ILLEGAL = []
try {
  const csv = readFileSync(join(__dirname, 'ojk_illegal.csv'), 'utf-8')
  OJK_ILLEGAL = parseCSV(csv).map(row => ({
    name: row['Nama'] || '',
    address: row['Alamat'] || '-',
    phone: row['No. Telp'] || '',
    website: row['Website'] || '',
    entityType: row['Jenis Entitas'] || '',
    activityType: row['Jenis Kegiatan'] || '',
    dateAdded: row['Tgl Input'] || '',
    notes: row['Keterangan'] || '',
    status: 'ILEGAL',
    searchKey: (row['Nama'] || '').toLowerCase().replace(/[^a-z0-9\s]/g, ''),
  }))
  console.log(`[ojk] Loaded ${OJK_ILLEGAL.length} illegal entities from OJK Alert Portal`)
} catch (err) {
  console.warn('[ojk] Failed to load OJK CSV:', err.message)
}

// Build search index
const OJK_INDEX = new Map()
for (const entry of OJK_ILLEGAL) {
  OJK_INDEX.set(entry.searchKey, entry)
}

// Backward-compatible: OJK_LICENSED wraps both hardcoded licensed + CSV illegal
export const OJK_LICENSED = new Map([
  ['pt manulife aset manajemen indonesia', { name: 'PT Manulife Aset Manajemen Indonesia', license: 'KEP-07/PM/MI/1996', type: 'Manajer Investasi', status: 'TERDAFTAR' }],
  ['pt mandiri manajemen investasi', { name: 'PT Mandiri Manajemen Investasi', license: 'KEP-11/PM/MI/2004', type: 'Manajer Investasi', status: 'TERDAFTAR' }],
  ['pt bank central asia tbk', { name: 'PT Bank Central Asia Tbk', license: 'No.275/KMK.013/1991', type: 'Perbankan', status: 'TERDAFTAR' }],
  ['pt bank rakyat indonesia tbk', { name: 'PT Bank Rakyat Indonesia (Persero) Tbk', license: 'No.S-48/MK.17/1992', type: 'Perbankan', status: 'TERDAFTAR' }],
])

export function searchOJK(query, limit = 20) {
  const q = String(query || '').trim().toLowerCase().replace(/[^a-z0-9\s]/g, '')
  if (!q) return []

  // Check licensed first
  for (const [key, val] of OJK_LICENSED) {
    if (key.includes(q) || q.includes(key)) return [{ ...val, searchKey: key }]
  }

  // Exact match in illegal index
  const exact = OJK_INDEX.get(q)
  if (exact) return [exact]

  // Substring match
  const results = []
  for (const entry of OJK_ILLEGAL) {
    if (entry.searchKey.includes(q) || q.includes(entry.searchKey)) {
      results.push(entry)
      if (results.length >= limit) break
    }
  }
  return results
}

export function getOJKStats() {
  const byType = {}
  const byActivity = {}
  for (const e of OJK_ILLEGAL) {
    byType[e.entityType] = (byType[e.entityType] || 0) + 1
    byActivity[e.activityType] = (byActivity[e.activityType] || 0) + 1
  }
  return { total: OJK_ILLEGAL.length, byType, byActivity }
}

export const RED_FLAGS = [
  'Menjanjikan return pasti >2%/bulan',
  'Tidak punya izin OJK/Bappebti',
  'Minta rekrut orang lain (skema ponzi)',
  'Tekanan untuk segera transfer',
  'Tidak bisa ditarik (withdrawal sulit)',
  'Pakai nama mirip perusahaan resmi',
  'Minta data pribadi berlebihan (KTP, selfie, PIN)',
  'Kantor tidak jelas / hanya online',
]
