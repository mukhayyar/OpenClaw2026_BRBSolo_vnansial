import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import PageShell from '../components/PageShell'
import Bento from '../components/Bento'
import TradingChart from '../components/TradingChart'
import AnalysisModal from '../components/AnalysisModal'

const API = import.meta.env.VITE_API_URL || ''

type Emiten = { code: string; name: string; sector?: string }
type Overview = {
  code: string
  profile?: any
  dividenTunai?: any
  dividenSaham?: any
  esg?: any
  pemegang?: any
  announcement?: any
}

function fmt(n: number) {
  if (!Number.isFinite(n)) return '—'
  return new Intl.NumberFormat('id-ID').format(n)
}

function EmptyIDX({ label, code, path }: { label: string; code: string; path: string }) {
  return (
    <div className="text-[12.5px] text-[var(--vn-ink-soft)] leading-relaxed">
      <p className="mb-2">{label}</p>
      <p className="text-[var(--vn-muted)] text-[11px] mb-2">
        Catatan: IDX kadang membatasi akses dari server di luar Indonesia.
        Grafik harga tetap aktif lewat Yahoo Finance.
      </p>
      <a
        href={path}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-[12px] text-[var(--vn-forest)] underline"
      >
        Buka {code} di idx.co.id ↗
      </a>
    </div>
  )
}

export default function CekEmiten() {
  const [query, setQuery] = useState('')
  const [code, setCode] = useState('BBCA')
  const [list, setList] = useState<Emiten[]>([])
  const [overview, setOverview] = useState<Overview | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [analyzeOpen, setAnalyzeOpen] = useState(false)

  useEffect(() => {
    fetch(`${API}/api/idx/emiten`)
      .then(r => r.json())
      .then(d => setList(d.companies || []))
      .catch(() => setList([]))
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return list.slice(0, 24)
    return list
      .filter(e => e.code.toLowerCase().includes(q) || e.name.toLowerCase().includes(q))
      .slice(0, 24)
  }, [list, query])

  async function loadOverview(c: string) {
    setLoading(true)
    setError(null)
    setCode(c.toUpperCase())
    try {
      const res = await fetch(`${API}/api/idx/${encodeURIComponent(c.toUpperCase())}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setOverview(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat IDX')
      setOverview(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOverview('BBCA')
  }, [])

  const profile = overview?.profile?.Profiles?.[0] || overview?.profile?.profile?.[0]
  const dividenTunaiRows = overview?.dividenTunai?.Replies || overview?.dividenTunai?.replies || []
  const pemegangRows = overview?.pemegang?.Replies || overview?.pemegang?.replies || []
  const announceRows = overview?.announcement?.Replies || overview?.announcement?.replies || []

  return (
    <PageShell
      eyebrow="Saham Indonesia · IDX"
      title="Cek emiten dengan satu klik."
      subtitle="Data resmi IDX di-proxy lokal: profil, dividen, pemegang saham, ESG, dan kalender korporasi."
    >
      <div className="grid lg:grid-cols-5 gap-4 sm:gap-6">
        <Bento padding="lg" className="lg:col-span-2">
          <p className="vn-eyebrow mb-3">Cari emiten</p>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="BBCA, GOTO, atau nama perusahaan…"
            className="vn-input mb-4"
          />
          <div className="grid grid-cols-2 gap-2 max-h-[420px] overflow-y-auto pr-1">
            {filtered.map(e => (
              <button
                key={e.code}
                onClick={() => loadOverview(e.code)}
                className={`text-left rounded-2xl px-3.5 py-2.5 transition-colors ${
                  code === e.code
                    ? 'bg-[var(--vn-forest)] text-white'
                    : 'bg-[var(--vn-bg-deep)] hover:bg-[var(--vn-cream)]'
                }`}
              >
                <p className="font-mono text-[12px] font-bold">{e.code}</p>
                <p className="text-[11px] opacity-80 line-clamp-1">{e.name}</p>
              </button>
            ))}
            {!filtered.length && (
              <p className="col-span-2 text-[13px] text-[var(--vn-muted)]">
                Tidak ada emiten yang cocok.
              </p>
            )}
          </div>
        </Bento>

        <div className="lg:col-span-3 space-y-4 sm:space-y-6">
          <Bento padding="lg" tone="forest">
            <p className="vn-eyebrow !text-[var(--vn-mint)] mb-2">Profil emiten</p>
            <motion.h2
              key={code}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="vn-display text-[40px] text-white"
            >
              {code}
            </motion.h2>
            {loading && <p className="text-white/70 mt-2">Memuat data IDX…</p>}
            {error && <p className="text-[var(--vn-red-soft)] mt-2">{error}</p>}
            <div className="mt-5">
              <TradingChart kind="saham" symbol={code} height={180} showAxis={false} range="3mo" />
            </div>
            <button
              onClick={() => setAnalyzeOpen(true)}
              className="mt-4 inline-flex vn-btn vn-btn-on-dark text-[13px]"
            >
              ✨ Analisis lengkap dengan AI
            </button>
            {profile && (
              <dl className="mt-4 grid sm:grid-cols-2 gap-3 text-white">
                <div>
                  <dt className="text-[11px] uppercase tracking-wider text-white/55">Nama</dt>
                  <dd className="text-[15px]">{profile.NamaEmiten || '—'}</dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-wider text-white/55">Sektor</dt>
                  <dd className="text-[15px]">{profile.Sektor || profile.Industri || '—'}</dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-wider text-white/55">Listing</dt>
                  <dd className="text-[15px]">{profile.TanggalPencatatan || '—'}</dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-wider text-white/55">Papan</dt>
                  <dd className="text-[15px]">{profile.PapanPencatatan || '—'}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-[11px] uppercase tracking-wider text-white/55">Alamat</dt>
                  <dd className="text-[13px] text-white/80">{profile.Alamat || '—'}</dd>
                </div>
              </dl>
            )}
          </Bento>

          <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
            <Bento padding="md" tone="cream">
              <p className="vn-eyebrow mb-2">Dividen tunai terakhir</p>
              {dividenTunaiRows.length ? (
                <ul className="space-y-2">
                  {dividenTunaiRows.slice(0, 4).map((d: any, i: number) => (
                    <li key={i} className="flex justify-between text-[13px]">
                      <span>{d.TahunBuku || d.Tahun || '—'}</span>
                      <span className="font-semibold">Rp {fmt(d.DividenTunai || d.dividen || 0)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyIDX
                  label="Belum ada data dividen tunai dari IDX untuk tahun ini."
                  code={code}
                  path={`https://www.idx.co.id/id/perusahaan-tercatat/profil-perusahaan-tercatat/${code}/`}
                />
              )}
            </Bento>

            <Bento padding="md" tone="mint">
              <p className="vn-eyebrow mb-2">Pemegang saham besar</p>
              {pemegangRows.length ? (
                <ul className="space-y-2">
                  {pemegangRows.slice(0, 4).map((d: any, i: number) => (
                    <li key={i} className="flex justify-between text-[13px]">
                      <span className="truncate max-w-[60%]">{d.NamaPemegang || d.Nama || '—'}</span>
                      <span className="font-semibold">{d.Persentase || d.persentase || '—'}%</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyIDX
                  label="IDX tidak menyajikan data pemegang saham untuk endpoint ini."
                  code={code}
                  path={`https://www.idx.co.id/id/perusahaan-tercatat/profil-perusahaan-tercatat/${code}/`}
                />
              )}
            </Bento>
          </div>

          <Bento padding="md">
            <p className="vn-eyebrow mb-2">Pengumuman korporasi terakhir</p>
            {announceRows.length ? (
              <ul className="space-y-2">
                {announceRows.slice(0, 5).map((a: any, i: number) => (
                  <li key={i} className="text-[13px] text-[var(--vn-ink-soft)]">
                    <span className="text-[var(--vn-muted)] mr-2">{a.Tanggal || a.TanggalPengumuman}</span>
                    <span>{a.Judul || a.JudulPengumuman || '—'}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyIDX
                label="Belum ada pengumuman publik dalam 1 tahun terakhir untuk emiten ini."
                code={code}
                path={`https://www.idx.co.id/id/perusahaan-tercatat/profil-perusahaan-tercatat/${code}/`}
              />
            )}
          </Bento>
        </div>
      </div>

      <AnalysisModal
        open={analyzeOpen}
        kind="saham"
        symbol={code}
        name={profile?.NamaEmiten}
        onClose={() => setAnalyzeOpen(false)}
      />
    </PageShell>
  )
}
