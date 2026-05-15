import { useState } from 'react'
import { motion } from 'framer-motion'

// Simulated OJK database of licensed entities
const OJK_LICENSED = new Map([
  ['pt manulife aset manajemen indonesia', { name: 'PT Manulife Aset Manajemen Indonesia', license: 'KEP-07/PM/MI/1996', type: 'Manajer Investasi', status: 'TERDAFTAR' }],
  ['pt mandiri manajemen investasi', { name: 'PT Mandiri Manajemen Investasi', license: 'KEP-11/PM/MI/2004', type: 'Manajer Investasi', status: 'TERDAFTAR' }],
  ['pt bank central asia tbk', { name: 'PT Bank Central Asia Tbk', license: 'No.275/KMK.013/1991', type: 'Perbankan', status: 'TERDAFTAR' }],
  ['pt bank rakyat indonesia tbk', { name: 'PT Bank Rakyat Indonesia (Persero) Tbk', license: 'No.S-48/MK.17/1992', type: 'Perbankan', status: 'TERDAFTAR' }],
  ['binomo', { name: 'Binomo', license: '-', type: 'Binary Options', status: 'ILEGAL' }],
  ['quotex', { name: 'Quotex', license: '-', type: 'Binary Options', status: 'ILEGAL' }],
  ['danamaster', { name: 'DanaMaster', license: '-', type: 'Robot Trading', status: 'ILEGAL' }],
  ['robot trading forex', { name: 'Robot Trading Forex (Umum)', license: '-', type: 'Robot Trading', status: 'ILEGAL' }],
])

const RED_FLAGS = [
  'Menjanjikan return pasti >2%/bulan',
  'Tidak punya izin OJK/Bappebti',
  'Minta rekrut orang lain (skema ponzi)',
  'Tekanan untuk segera transfer',
  'Tidak bisa ditarik (withdrawal sulit)',
  'Pakai nama mirip perusahaan resmi',
  'Minta data pribadi berlebihan (KTP, selfie, PIN)',
  'Kantor tidak jelas / hanya online',
]

export default function CekInvestasi() {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<null | {
    found: boolean
    data?: { name: string; license: string; type: string; status: string }
  }>(null)
  const [checkedFlags, setCheckedFlags] = useState<boolean[]>(new Array(RED_FLAGS.length).fill(false))

  function handleSearch() {
    const q = query.trim().toLowerCase()
    if (!q) return

    const match = OJK_LICENSED.get(q)
    if (match) {
      setResult({ found: true, data: match })
    } else {
      setResult({ found: false })
    }
  }

  const flagCount = checkedFlags.filter(Boolean).length
  const riskLevel = flagCount === 0 ? null : flagCount <= 2 ? 'low' : flagCount <= 4 ? 'medium' : 'high'

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold mb-2">🔍 Cek Investasi</h1>
        <p className="text-slate-400 mb-8">
          Verifikasi apakah perusahaan investasi terdaftar resmi di OJK (Otoritas Jasa Keuangan).
        </p>

        {/* Search */}
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 mb-8">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Nama Perusahaan / Platform
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Contoh: Binomo, PT Manulife..."
              className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30"
            />
            <button
              onClick={handleSearch}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all"
            >
              Cek
            </button>
          </div>

          <p className="mt-2 text-xs text-slate-500">
            * Database demo. Di produksi akan terhubung langsung ke API OJK / SWI (Satgas Waspada Investasi).
          </p>
        </div>

        {/* Result */}
        {result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8"
          >
            {result.found && result.data ? (
              <div className={`p-6 rounded-2xl border ${
                result.data.status === 'TERDAFTAR'
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-red-500/10 border-red-500/30'
              }`}>
                <div className="flex items-start gap-4">
                  <div className="text-4xl">
                    {result.data.status === 'TERDAFTAR' ? '✅' : '🚫'}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-1">{result.data.name}</h3>
                    <div className={`inline-block px-3 py-1 rounded-full text-sm font-bold mb-3 ${
                      result.data.status === 'TERDAFTAR'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {result.data.status}
                    </div>
                    <div className="space-y-1 text-sm text-slate-400">
                      <p><strong className="text-slate-300">Tipe:</strong> {result.data.type}</p>
                      <p><strong className="text-slate-300">Lisensi:</strong> {result.data.license}</p>
                    </div>
                    {result.data.status === 'ILEGAL' && (
                      <div className="mt-4 p-3 rounded-xl bg-red-500/10 text-sm text-red-300">
                        ⚠️ <strong>PERINGATAN:</strong> Entitas ini TIDAK memiliki izin dari OJK/Bappebti.
                        Segera hentikan aktivitas dan laporkan ke OJK di 157 atau{' '}
                        <a href="https://konsumen.ojk.go.id" className="underline" target="_blank" rel="noopener">
                          konsumen.ojk.go.id
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">⚠️</div>
                  <div>
                    <h3 className="text-xl font-bold mb-1">Tidak Ditemukan</h3>
                    <p className="text-slate-400 text-sm">
                      "<strong className="text-white">{query}</strong>" tidak ditemukan di database kami.
                      Ini bisa berarti belum terdaftar atau nama yang dimasukkan berbeda.
                    </p>
                    <p className="text-slate-400 text-sm mt-2">
                      Cek langsung di{' '}
                      <a href="https://sikapiuangmu.ojk.go.id" className="text-emerald-400 underline" target="_blank" rel="noopener">
                        sikapiuangmu.ojk.go.id
                      </a>{' '}
                      atau hubungi OJK di <strong className="text-white">157</strong>.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Red Flag Checklist */}
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
          <h2 className="text-xl font-bold mb-1">🚩 Cek Red Flag</h2>
          <p className="text-sm text-slate-400 mb-4">
            Centang tanda-tanda yang kamu temukan pada investasi yang ditawarkan:
          </p>

          <div className="space-y-3 mb-6">
            {RED_FLAGS.map((flag, i) => (
              <label key={i} className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={checkedFlags[i]}
                  onChange={() => {
                    const next = [...checkedFlags]
                    next[i] = !next[i]
                    setCheckedFlags(next)
                  }}
                  className="mt-0.5 w-5 h-5 rounded border-slate-600 bg-white/5 text-emerald-500 focus:ring-emerald-500/30 accent-emerald-500"
                />
                <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                  {flag}
                </span>
              </label>
            ))}
          </div>

          {riskLevel && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`p-4 rounded-xl text-center font-bold ${
                riskLevel === 'high'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : riskLevel === 'medium'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {riskLevel === 'high' && `🚫 RISIKO SANGAT TINGGI (${flagCount}/8) — Kemungkinan besar PENIPUAN. JANGAN investasi!`}
              {riskLevel === 'medium' && `⚠️ RISIKO MENENGAH (${flagCount}/8) — Hati-hati, ada beberapa tanda mencurigakan.`}
              {riskLevel === 'low' && `🟡 RISIKO RENDAH (${flagCount}/8) — Tetap verifikasi ke OJK sebelum investasi.`}
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
