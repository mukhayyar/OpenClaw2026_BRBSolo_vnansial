import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import PageShell from '../components/PageShell'
import Bento from '../components/Bento'

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

interface OJKResult {
  name: string
  entityType: string
  activityType: string
  dateAdded: string
  notes: string
  website: string
  status: string
  license?: string
  type?: string
}

export default function CekInvestasi() {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<null | {
    found: boolean
    data?: OJKResult
    matches?: OJKResult[]
  }>(null)
  const [loading, setLoading] = useState(false)
  const [dbSize, setDbSize] = useState(0)
  const [checkedFlags, setCheckedFlags] = useState<boolean[]>(new Array(RED_FLAGS.length).fill(false))

  useEffect(() => {
    fetch('/api/ojk/stats').then(r => r.json()).then(d => setDbSize(d.total)).catch(() => {})
  }, [])

  async function handleSearch() {
    const q = query.trim()
    if (!q) return
    setLoading(true)
    try {
      const res = await fetch(`/api/ojk/search?q=${encodeURIComponent(q)}&limit=10`)
      const data = await res.json()
      if (data.results?.length > 0) {
        setResult({ found: true, data: data.results[0], matches: data.results })
      } else {
        setResult({ found: false })
      }
    } catch {
      setResult({ found: false })
    } finally {
      setLoading(false)
    }
  }

  const flagCount = checkedFlags.filter(Boolean).length
  const riskLevel = flagCount === 0 ? null : flagCount <= 2 ? 'low' : flagCount <= 4 ? 'medium' : 'high'

  return (
    <PageShell
      eyebrow="Verifikasi"
      title="Cek izin OJK sebelum kamu transfer."
      subtitle={`Database ${dbSize ? dbSize.toLocaleString('id-ID') + '+ entitas ilegal' : ''} dari OJK Satgas Waspada Investasi. Untuk verifikasi resmi, kunjungi sikapiuangmu.ojk.go.id.`}
    >
      {/* Search */}
      <Bento className="mb-6" padding="lg">
        <label className="vn-eyebrow mb-3 block">Nama perusahaan / platform</label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Contoh: Binomo, PT Manulife…"
            className="vn-input"
          />
          <button onClick={handleSearch} disabled={loading} className="vn-btn vn-btn-primary">
            {loading ? 'Mencari…' : 'Cek sekarang'}
          </button>
        </div>
        <p className="mt-3 text-[12px] text-[var(--vn-muted)]">
          Coba: <button type="button" className="underline text-[var(--vn-forest)]" onClick={() => { setQuery('binomo'); setTimeout(handleSearch, 0) }}>binomo</button>{' · '}
          <button type="button" className="underline text-[var(--vn-forest)]" onClick={() => { setQuery('pt manulife aset manajemen indonesia'); setTimeout(handleSearch, 0) }}>PT Manulife</button>{' · '}
          <button type="button" className="underline text-[var(--vn-forest)]" onClick={() => { setQuery('quotex'); setTimeout(handleSearch, 0) }}>quotex</button>
        </p>
      </Bento>

      {result && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          {result.found && result.data ? (
            <div className="space-y-3">
              <div
                className={`bento bento-pad-lg ${
                  result.data.status === 'TERDAFTAR' ? 'bento-mint' : ''
                }`}
                style={result.data.status === 'ILEGAL'
                  ? { background: 'var(--vn-red-soft)', borderColor: 'rgba(185, 28, 28, 0.18)' }
                  : undefined}
              >
                <div className="flex items-start gap-4 flex-wrap">
                  <div className="flex-1 min-w-[240px]">
                    <span className={
                      result.data.status === 'TERDAFTAR'
                        ? 'vn-chip'
                        : 'vn-chip vn-chip-red'
                    }>
                      {result.data.status === 'TERDAFTAR' ? '✓ Terdaftar OJK' : '✕ Ilegal'}
                    </span>
                    <h3 className="vn-headline text-[26px] sm:text-[32px] mt-3 mb-2">{result.data.name}</h3>
                    <dl className="grid grid-cols-2 gap-3 text-[14px]">
                      <div>
                        <dt className="text-[var(--vn-muted)] text-[12px]">Jenis Entitas</dt>
                        <dd className="font-medium">{result.data.entityType || result.data.type || '-'}</dd>
                      </div>
                      <div>
                        <dt className="text-[var(--vn-muted)] text-[12px]">Jenis Kegiatan</dt>
                        <dd className="font-medium">{result.data.activityType || result.data.license || '-'}</dd>
                      </div>
                      {result.data.dateAdded && (
                        <div>
                          <dt className="text-[var(--vn-muted)] text-[12px]">Tanggal Diblokir</dt>
                          <dd className="font-medium">{result.data.dateAdded}</dd>
                        </div>
                      )}
                      {result.data.notes && (
                        <div>
                          <dt className="text-[var(--vn-muted)] text-[12px]">Keterangan</dt>
                          <dd className="font-medium">{result.data.notes}</dd>
                        </div>
                      )}
                    </dl>
                    {result.data.status === 'ILEGAL' && (
                      <p className="mt-4 text-[14px] text-[var(--vn-red)] font-medium">
                        Peringatan: entitas ini terdaftar ILEGAL oleh OJK. Lapor ke OJK 157 atau{' '}
                        <a href="https://konsumen.ojk.go.id" className="underline">konsumen.ojk.go.id</a>.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Additional matches */}
              {result.matches && result.matches.length > 1 && (
                <div className="bento bento-pad-lg">
                  <p className="vn-eyebrow mb-3">{result.matches.length - 1} hasil lainnya</p>
                  <div className="space-y-2">
                    {result.matches.slice(1, 6).map((m, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-[var(--vn-bg-deep)]">
                        <div>
                          <div className="text-[14px] font-medium">{m.name}</div>
                          <div className="text-[12px] text-[var(--vn-muted)]">{m.entityType} — {m.activityType}</div>
                        </div>
                        <span className="vn-chip vn-chip-red text-[11px]">Ilegal</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bento bento-pad-lg" style={{ background: 'var(--vn-amber-soft)', borderColor: 'rgba(217, 119, 6, 0.18)' }}>
              <span className="vn-chip vn-chip-amber">Tidak ditemukan</span>
              <h3 className="vn-headline text-[22px] mt-3 mb-2">
                "{query}" tidak ditemukan di {dbSize ? `${dbSize.toLocaleString('id-ID')}+` : ''} database OJK.
              </h3>
              <p className="text-[14px] text-[var(--vn-ink-soft)]">
                Belum tentu aman. Verifikasi langsung di{' '}
                <a href="https://sikapiuangmu.ojk.go.id" className="underline text-[var(--vn-forest)]">sikapiuangmu.ojk.go.id</a>{' '}
                atau hubungi <strong>OJK 157</strong>.
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* Red flag bento */}
      <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
        <Bento className="md:col-span-2" padding="lg">
          <p className="vn-eyebrow mb-3">Checklist red flag</p>
          <h2 className="vn-headline text-[24px] sm:text-[28px] mb-5">
            Centang tanda yang kamu lihat.
          </h2>
          <div className="space-y-2">
            {RED_FLAGS.map((flag, i) => (
              <label
                key={i}
                className={`flex items-start gap-3 rounded-2xl p-3.5 cursor-pointer transition-colors ${
                  checkedFlags[i]
                    ? 'bg-[var(--vn-red-soft)] border border-[var(--vn-red)]/20'
                    : 'bg-[var(--vn-bg-deep)] border border-transparent'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checkedFlags[i]}
                  onChange={() => {
                    const next = [...checkedFlags]
                    next[i] = !next[i]
                    setCheckedFlags(next)
                  }}
                  className="mt-0.5 w-5 h-5 accent-[var(--vn-forest)]"
                />
                <span className="text-[14.5px] text-[var(--vn-ink)] leading-relaxed">{flag}</span>
              </label>
            ))}
          </div>
        </Bento>

        <Bento tone={riskLevel === 'high' ? 'ink' : riskLevel === 'medium' ? 'mint' : 'cream'} padding="lg">
          <p className={`vn-eyebrow mb-3 ${riskLevel === 'high' ? '!text-[var(--vn-mint)]' : ''}`}>
            Penilaian
          </p>
          <div className={`vn-display text-[64px] mb-1 ${riskLevel === 'high' ? 'text-white' : ''}`}>
            {flagCount}<span className="text-[var(--vn-muted)] text-[28px]">/8</span>
          </div>
          {riskLevel === null && (
            <p className={`text-[14px] ${riskLevel === 'high' ? 'text-white/80' : 'text-[var(--vn-ink-soft)]'}`}>
              Centang minimal satu untuk melihat penilaian.
            </p>
          )}
          {riskLevel === 'low' && (
            <p className="text-[14px] text-[var(--vn-ink-soft)] leading-relaxed">
              Risiko rendah. Tetap verifikasi langsung di OJK sebelum berinvestasi.
            </p>
          )}
          {riskLevel === 'medium' && (
            <p className="text-[14px] text-[var(--vn-ink-soft)] leading-relaxed">
              Hati-hati. Ada beberapa tanda mencurigakan — minta bukti izin OJK.
            </p>
          )}
          {riskLevel === 'high' && (
            <p className="text-[14px] text-white/80 leading-relaxed">
              Risiko sangat tinggi. Kemungkinan besar penipuan. Jangan transfer.
            </p>
          )}
        </Bento>
      </div>
    </PageShell>
  )
}
