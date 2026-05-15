import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import PageShell from '../components/PageShell'
import Bento from '../components/Bento'
import PinGate from '../components/PinGate'
import MoneyInput from '../components/MoneyInput'
import { pinHeader, getPin } from '../lib/auth'

const API = import.meta.env.VITE_API_URL || ''
const STORAGE_KEY = 'vnansial-portfolio-v3'

type AssetKind = 'saham' | 'crypto' | 'reksadana' | 'obligasi' | 'logam'

type Holding = {
  id: string
  kind: AssetKind
  symbol: string
  amount: number
  costBasis?: number
}

type Buffer = {
  kind: 'emergency' | 'money_buffer'
  amount: number
  target: number
}

type Tujuan = {
  id: string
  name: string
  category: 'asset' | 'phone' | 'home' | 'travel' | 'vehicle' | 'education' | 'other'
  amount: number
  target: number
  isComplete: boolean
  isUsed: boolean
}

type CashflowEntry = {
  id: string
  date: string
  category: string
  type: 'income' | 'expense'
  amount: number
  note?: string
}

const KIND_LABEL: Record<AssetKind, string> = {
  saham: 'Saham',
  crypto: 'Crypto',
  reksadana: 'Reksadana',
  obligasi: 'Obligasi',
  logam: 'Logam mulia',
}

const TUJUAN_LABEL: Record<Tujuan['category'], { icon: string; label: string }> = {
  asset: { icon: '🏷️', label: 'Aset umum' },
  phone: { icon: '📱', label: 'Gadget' },
  home: { icon: '🏠', label: 'Rumah' },
  travel: { icon: '✈️', label: 'Travel' },
  vehicle: { icon: '🚗', label: 'Kendaraan' },
  education: { icon: '🎓', label: 'Pendidikan' },
  other: { icon: '📌', label: 'Lainnya' },
}

function fmt(n: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n)
}

function fmtUSD(n: number) {
  if (!Number.isFinite(n)) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(n)
}

type State = {
  holdings: Holding[]
  buffers: Buffer[]
  tujuan: Tujuan[]
  cashflow: CashflowEntry[]
}

const DEFAULT: State = {
  holdings: [],
  buffers: [
    { kind: 'emergency', amount: 0, target: 0 },
    { kind: 'money_buffer', amount: 0, target: 0 },
  ],
  tujuan: [],
  cashflow: [],
}

export default function Portofolio() {
  return (
    <PageShell
      eyebrow="Portofolio · Money buffer · Cashflow"
      title="Semua aset & cadanganmu, real time."
      subtitle="Saham, crypto, reksadana, obligasi, logam, dana darurat, tabungan tujuan, dan cashflow — semuanya satu peta. Aktifkan PIN supaya tersinkron ke SQLite & asisten AI bisa bantu update."
    >
      <PinGate
        title="Buka kunci Portofolio"
        reason="Portofolio kamu disimpan di SQLite. PIN memastikan hanya kamu (dan asisten AI dalam sesi ini) yang bisa membaca atau mengubahnya. Tanpa PIN, kamu masih bisa pakai versi lokal (browser-only)."
        optional
      >
        <PortofolioBody />
      </PinGate>
    </PageShell>
  )
}

function PortofolioBody() {
  const [state, setState] = useState<State>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      const parsed = raw ? JSON.parse(raw) : null
      return parsed ? { ...DEFAULT, ...parsed } : DEFAULT
    } catch {
      return DEFAULT
    }
  })
  const [syncing, setSyncing] = useState(false)
  const [livePrices, setLivePrices] = useState<Record<string, { price: number; currency: string }>>({})

  // Pull holdings/buffers from server when PIN is set
  useEffect(() => {
    if (!getPin()) return
    fetch(`${API}/api/me/portfolio`, { headers: pinHeader() })
      .then(r => r.json())
      .then(d => {
        if (d.error) return
        if (Array.isArray(d.holdings)) {
          const remoteHoldings: Holding[] = d.holdings.map((h: any) => ({
            id: String(h.id),
            kind: h.kind,
            symbol: h.symbol,
            amount: h.amount,
            costBasis: h.cost_basis ?? undefined,
          }))
          const remoteBuffers: Buffer[] = ['emergency', 'money_buffer'].map(k => {
            const b = d.buffers.find((x: any) => x.kind === k)
            return { kind: k as Buffer['kind'], amount: b?.amount || 0, target: b?.target || 0 }
          })
          setState(s => ({ ...s, holdings: remoteHoldings, buffers: remoteBuffers }))
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  // Fetch live prices for holdings (Yahoo for saham, CoinGecko for crypto)
  useEffect(() => {
    state.holdings.forEach(async h => {
      try {
        if (h.kind === 'saham') {
          const sym = h.symbol.includes('.') ? h.symbol : `${h.symbol}.JK`
          const res = await fetch(`${API}/api/market/quote?symbol=${encodeURIComponent(sym)}`)
          const data = await res.json()
          if (data?.regularMarketPrice) {
            setLivePrices(p => ({ ...p, [`${h.kind}:${h.symbol}`]: { price: data.regularMarketPrice, currency: data.currency || 'IDR' } }))
          }
        } else if (h.kind === 'crypto') {
          const res = await fetch(`${API}/api/crypto/coin?id=${encodeURIComponent(h.symbol.toLowerCase())}`)
          const data = await res.json()
          if (data?.price) {
            setLivePrices(p => ({ ...p, [`${h.kind}:${h.symbol}`]: { price: data.price, currency: 'USD' } }))
          }
        }
      } catch {
        // ignore
      }
    })
  }, [state.holdings])

  async function persistHolding(h: Omit<Holding, 'id'>) {
    if (!getPin()) return
    setSyncing(true)
    await fetch(`${API}/api/me/portfolio/holding`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...pinHeader() },
      body: JSON.stringify(h),
    }).catch(() => {})
    setSyncing(false)
  }

  async function persistDelete(h: Holding) {
    if (!getPin()) return
    setSyncing(true)
    await fetch(`${API}/api/me/portfolio/holding`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...pinHeader() },
      body: JSON.stringify({ kind: h.kind, symbol: h.symbol }),
    }).catch(() => {})
    setSyncing(false)
  }

  async function persistBuffer(b: Buffer) {
    if (!getPin()) return
    setSyncing(true)
    await fetch(`${API}/api/me/portfolio/buffer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...pinHeader() },
      body: JSON.stringify(b),
    }).catch(() => {})
    setSyncing(false)
  }

  // ----- Holdings -----
  function addHolding(h: Omit<Holding, 'id'>) {
    if (!h.symbol.trim() || h.amount <= 0) return
    const next: Holding = { ...h, symbol: h.symbol.toUpperCase().trim(), id: crypto.randomUUID() }
    setState(s => ({ ...s, holdings: [...s.holdings, next] }))
    persistHolding(next)
  }
  function removeHolding(id: string) {
    const target = state.holdings.find(h => h.id === id)
    setState(s => ({ ...s, holdings: s.holdings.filter(h => h.id !== id) }))
    if (target) persistDelete(target)
  }

  // ----- Buffers -----
  function updateBuffer(kind: Buffer['kind'], patch: Partial<Buffer>) {
    setState(s => {
      const next = { ...s, buffers: s.buffers.map(b => (b.kind === kind ? { ...b, ...patch } : b)) }
      const changed = next.buffers.find(b => b.kind === kind)
      if (changed) persistBuffer(changed)
      return next
    })
  }

  // ----- Tujuan -----
  function addTujuan(t: Omit<Tujuan, 'id'>) {
    if (!t.name.trim()) return
    setState(s => ({ ...s, tujuan: [...s.tujuan, { ...t, id: crypto.randomUUID() }] }))
  }
  function updateTujuan(id: string, patch: Partial<Tujuan>) {
    setState(s => ({ ...s, tujuan: s.tujuan.map(t => (t.id === id ? { ...t, ...patch } : t)) }))
  }
  function removeTujuan(id: string) {
    setState(s => ({ ...s, tujuan: s.tujuan.filter(t => t.id !== id) }))
  }

  // ----- Cashflow -----
  function addCash(entry: Omit<CashflowEntry, 'id'>) {
    if (!entry.amount) return
    setState(s => ({ ...s, cashflow: [{ ...entry, id: crypto.randomUUID() }, ...s.cashflow].slice(0, 200) }))
  }
  function removeCash(id: string) {
    setState(s => ({ ...s, cashflow: s.cashflow.filter(c => c.id !== id) }))
  }

  // ----- Aggregates -----
  const liveValue = useMemo(() => {
    return state.holdings.reduce((sum, h) => {
      const live = livePrices[`${h.kind}:${h.symbol}`]
      const ccy = live?.currency || 'IDR'
      const usdToIdr = 16000 // simple FX assumption; sufficient for relative comparison
      const idr = live ? (ccy === 'IDR' ? live.price : live.price * usdToIdr) : (h.costBasis || 0)
      return sum + idr * h.amount
    }, 0)
  }, [state.holdings, livePrices])

  const totalCost = useMemo(
    () => state.holdings.reduce((sum, h) => sum + (h.costBasis || 0) * h.amount, 0),
    [state.holdings],
  )

  const totalBuffer = useMemo(
    () => state.buffers.reduce((sum, b) => sum + b.amount, 0),
    [state.buffers],
  )

  const totalTujuan = useMemo(
    () => state.tujuan.filter(t => !t.isUsed).reduce((sum, t) => sum + t.amount, 0),
    [state.tujuan],
  )

  const monthlyCashflow = useMemo(() => {
    const now = new Date()
    const month = now.toISOString().slice(0, 7)
    const monthEntries = state.cashflow.filter(c => c.date.startsWith(month))
    const income = monthEntries.filter(c => c.type === 'income').reduce((s, c) => s + c.amount, 0)
    const expense = monthEntries.filter(c => c.type === 'expense').reduce((s, c) => s + c.amount, 0)
    return { income, expense, net: income - expense }
  }, [state.cashflow])

  const profit = liveValue - totalCost

  return (
    <>
      {syncing && (
        <p className="text-[12px] text-[var(--vn-muted)] mb-3 flex items-center gap-2">
          <span className="vn-dot vn-pulse" /> Menyinkronkan ke SQLite…
        </p>
      )}

      {/* Summary tiles */}
      <div className="grid lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        <Bento padding="lg" tone="forest">
          <p className="vn-eyebrow !text-[var(--vn-mint)] mb-2">Nilai aset live</p>
          <p className="vn-display text-[36px] text-white">{fmt(liveValue)}</p>
          <p className={`text-[13px] mt-1 ${profit >= 0 ? 'text-[var(--vn-mint)]' : 'text-[var(--vn-red-soft)]'}`}>
            {profit >= 0 ? '↑' : '↓'} {fmt(Math.abs(profit))} vs cost basis
          </p>
        </Bento>
        <Bento padding="lg" tone="cream">
          <p className="vn-eyebrow mb-2">Buffer + tujuan</p>
          <p className="vn-display text-[36px] text-[var(--vn-forest-dark)]">{fmt(totalBuffer + totalTujuan)}</p>
          <p className="text-[13px] text-[var(--vn-ink-soft)] mt-1">
            {state.tujuan.filter(t => !t.isUsed).length} tujuan aktif
          </p>
        </Bento>
        <Bento padding="lg" tone="mint">
          <p className="vn-eyebrow mb-2">Cashflow bulan ini</p>
          <p className={`vn-display text-[36px] ${monthlyCashflow.net >= 0 ? 'text-[var(--vn-forest-dark)]' : 'text-[var(--vn-red)]'}`}>
            {monthlyCashflow.net >= 0 ? '+' : '−'} {fmt(Math.abs(monthlyCashflow.net))}
          </p>
          <p className="text-[12px] text-[var(--vn-ink-soft)] mt-1">
            In {fmt(monthlyCashflow.income)} · Out {fmt(monthlyCashflow.expense)}
          </p>
        </Bento>
        <Bento padding="lg" tone="ink">
          <p className="vn-eyebrow !text-[var(--vn-mint)] mb-2">Net worth (manual)</p>
          <p className="vn-display text-[36px] text-white">{fmt(liveValue + totalBuffer + totalTujuan)}</p>
          <p className="text-white/55 text-[12px] mt-1">Aset live + buffer + tujuan (belum minus hutang)</p>
        </Bento>
      </div>

      {/* Add holding + list */}
      <div className="grid lg:grid-cols-5 gap-4 sm:gap-6 mb-8">
        <Bento padding="lg" className="lg:col-span-2">
          <p className="vn-eyebrow mb-3">Tambah holding</p>
          <HoldingForm onAdd={addHolding} />
        </Bento>

        <Bento padding="lg" className="lg:col-span-3">
          <p className="vn-eyebrow mb-3">Holding aktif · live</p>
          {state.holdings.length === 0 ? (
            <p className="text-[var(--vn-muted)] text-[14px]">Belum ada holding.</p>
          ) : (
            <ul className="space-y-2">
              {state.holdings.map(h => {
                const live = livePrices[`${h.kind}:${h.symbol}`]
                const liveValueIDR = live
                  ? (live.currency === 'IDR' ? live.price : live.price * 16000) * h.amount
                  : (h.costBasis || 0) * h.amount
                const costValue = (h.costBasis || 0) * h.amount
                const gain = liveValueIDR - costValue
                return (
                  <li
                    key={h.id}
                    className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 bg-[var(--vn-bg-deep)] rounded-2xl px-4 py-3"
                  >
                    <div>
                      <p className="font-mono text-[13px] font-bold">{h.symbol}</p>
                      <p className="text-[11px] text-[var(--vn-muted)]">
                        {KIND_LABEL[h.kind]} · {h.amount.toLocaleString('id-ID')}
                      </p>
                    </div>
                    <p className="text-[12px] text-[var(--vn-muted)] font-mono">
                      {live ? (live.currency === 'IDR' ? fmt(live.price) : fmtUSD(live.price)) : '—'}
                    </p>
                    <div className="text-right">
                      <p className="text-[13px] text-[var(--vn-forest-dark)] font-semibold">
                        {fmt(liveValueIDR)}
                      </p>
                      {h.costBasis ? (
                        <p className={`text-[11px] ${gain >= 0 ? 'text-[var(--vn-forest)]' : 'text-[var(--vn-red)]'}`}>
                          {gain >= 0 ? '+' : '−'}{fmt(Math.abs(gain))}
                        </p>
                      ) : null}
                    </div>
                    <button
                      onClick={() => removeHolding(h.id)}
                      className="text-[12px] text-[var(--vn-red)] hover:underline"
                    >
                      Hapus
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
          <p className="mt-3 text-[11px] text-[var(--vn-muted)]">
            Harga live dari Yahoo Finance (saham) dan CoinGecko (crypto). USD dikonversi pada kurs estimasi Rp 16.000/USD untuk penjumlahan IDR.
          </p>
        </Bento>
      </div>

      {/* Buffers */}
      <Bento padding="lg" className="mb-8">
        <p className="vn-eyebrow mb-3">Dana darurat & money buffer</p>
        <h3 className="vn-headline text-[22px] mb-5">Cadangan likuid kamu.</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {state.buffers.map(b => {
            const ratio = b.target > 0 ? Math.min(1, b.amount / b.target) : 0
            const label = b.kind === 'emergency' ? 'Dana Darurat' : 'Money Buffer'
            return (
              <div key={b.kind} className="bg-[var(--vn-bg-deep)] rounded-2xl p-4">
                <p className="vn-eyebrow mb-2">{label}</p>
                <div className="block text-[12px] mb-2">
                  <label>Saldo</label>
                  <div className="mt-1">
                    <MoneyInput value={b.amount || 0} onChange={v => updateBuffer(b.kind, { amount: v })} />
                  </div>
                </div>
                <div className="block text-[12px] mb-3">
                  <label>Target</label>
                  <div className="mt-1">
                    <MoneyInput value={b.target || 0} onChange={v => updateBuffer(b.kind, { target: v })} />
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-white overflow-hidden mb-2">
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${Math.round(ratio * 100)}%`,
                      background: 'linear-gradient(90deg, #4f9d63 0%, #2f7d3a 100%)',
                    }}
                  />
                </div>
                <p className="text-[11px] text-[var(--vn-muted)]">{Math.round(ratio * 100)}% dari target</p>
              </div>
            )
          })}
        </div>
      </Bento>

      {/* Tabungan Tujuan */}
      <Bento padding="lg" className="mb-8">
        <p className="vn-eyebrow mb-3">Tabungan tujuan</p>
        <h3 className="vn-headline text-[22px] mb-2">Goals yang sedang kamu kejar.</h3>
        <p className="text-[12.5px] text-[var(--vn-muted)] mb-5">
          Tandai <strong>selesai</strong> ketika target tercapai, dan <strong>terpakai</strong> setelah dana benar-benar digunakan untuk tujuan tersebut.
        </p>
        <TujuanForm onAdd={addTujuan} />
        <div className="mt-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {state.tujuan.length === 0 && (
            <p className="text-[var(--vn-muted)] text-[14px] sm:col-span-2 lg:col-span-3">
              Belum ada tujuan. Tambah dari form di atas.
            </p>
          )}
          {state.tujuan.map(t => {
            const meta = TUJUAN_LABEL[t.category]
            const ratio = t.target > 0 ? Math.min(1, t.amount / t.target) : 0
            const tone = t.isUsed
              ? 'bg-[var(--vn-bg-deep)] opacity-60'
              : t.isComplete
              ? 'bg-[var(--vn-cream)]'
              : 'bg-white border border-[var(--vn-line)]'
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-2xl p-4 ${tone}`}
              >
                <div className="flex justify-between items-start gap-2 mb-2">
                  <div>
                    <p className="text-[11px] text-[var(--vn-muted)] uppercase tracking-wider">
                      {meta.icon} {meta.label}
                    </p>
                    <p className="vn-headline text-[16px] mt-0.5">{t.name}</p>
                  </div>
                  <button onClick={() => removeTujuan(t.id)} className="text-[11px] text-[var(--vn-red)] hover:underline">
                    Hapus
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <label className="text-[11px]">
                    Saldo
                    <input type="number" value={t.amount || ''} onChange={e => updateTujuan(t.id, { amount: Number(e.target.value) })} className="vn-input mt-0.5 !py-1.5" />
                  </label>
                  <label className="text-[11px]">
                    Target
                    <input type="number" value={t.target || ''} onChange={e => updateTujuan(t.id, { target: Number(e.target.value) })} className="vn-input mt-0.5 !py-1.5" />
                  </label>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--vn-bg-deep)] overflow-hidden mb-2">
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${Math.round(ratio * 100)}%`,
                      background: t.isComplete
                        ? 'linear-gradient(90deg, #2f7d3a 0%, #235e2c 100%)'
                        : 'linear-gradient(90deg, #86c294 0%, #4f9d63 100%)',
                    }}
                  />
                </div>
                <p className="text-[10px] text-[var(--vn-muted)] mb-2">
                  {fmt(t.amount)} / {fmt(t.target)} · {Math.round(ratio * 100)}%
                </p>
                <div className="flex gap-3 text-[11px] flex-wrap">
                  <label className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={t.isComplete}
                      onChange={e => updateTujuan(t.id, { isComplete: e.target.checked })}
                      className="accent-[var(--vn-forest)]"
                    />
                    Selesai
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={t.isUsed}
                      onChange={e => updateTujuan(t.id, { isUsed: e.target.checked })}
                      className="accent-[var(--vn-forest)]"
                    />
                    Sudah dipakai
                  </label>
                </div>
              </motion.div>
            )
          })}
        </div>
      </Bento>

      {/* Cashflow */}
      <Bento padding="lg">
        <p className="vn-eyebrow mb-3">Cashflow bulanan</p>
        <h3 className="vn-headline text-[22px] mb-2">Catat pemasukan & pengeluaran.</h3>
        <p className="text-[12.5px] text-[var(--vn-muted)] mb-5">
          Bulan ini: pemasukan {fmt(monthlyCashflow.income)} · pengeluaran {fmt(monthlyCashflow.expense)} · net{' '}
          <strong className={monthlyCashflow.net >= 0 ? 'text-[var(--vn-forest-dark)]' : 'text-[var(--vn-red)]'}>
            {fmt(monthlyCashflow.net)}
          </strong>
        </p>
        <CashflowForm onAdd={addCash} />
        <ul className="mt-5 space-y-2 max-h-[420px] overflow-y-auto">
          {state.cashflow.length === 0 && (
            <p className="text-[var(--vn-muted)] text-[14px]">Belum ada catatan.</p>
          )}
          {state.cashflow.map(c => (
            <li
              key={c.id}
              className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 bg-[var(--vn-bg-deep)] rounded-2xl px-4 py-2.5"
            >
              <span className="text-[11px] font-mono text-[var(--vn-muted)]">{c.date}</span>
              <div>
                <p className="text-[13px]">{c.category}</p>
                {c.note && <p className="text-[11px] text-[var(--vn-muted)]">{c.note}</p>}
              </div>
              <p
                className={`text-[13px] font-semibold font-mono ${
                  c.type === 'income' ? 'text-[var(--vn-forest-dark)]' : 'text-[var(--vn-red)]'
                }`}
              >
                {c.type === 'income' ? '+' : '−'}{fmt(c.amount)}
              </p>
              <button onClick={() => removeCash(c.id)} className="text-[11px] text-[var(--vn-red)] hover:underline">
                Hapus
              </button>
            </li>
          ))}
        </ul>
      </Bento>
    </>
  )
}

/* ============================================================== */
/* HoldingForm — kind selector + searchable symbol dropdown        */
/* ============================================================== */

function HoldingForm({ onAdd }: { onAdd: (h: Omit<Holding, 'id'>) => void }) {
  const [kind, setKind] = useState<AssetKind>('saham')
  const [symbol, setSymbol] = useState('')
  const [amount, setAmount] = useState(0)
  const [costBasis, setCostBasis] = useState<number | undefined>(undefined)
  const [options, setOptions] = useState<{ value: string; label: string; hint?: string }[]>([])
  const [query, setQuery] = useState('')
  const [openDropdown, setOpenDropdown] = useState(false)

  // Load options on kind change
  useEffect(() => {
    setSymbol('')
    setQuery('')
    setOptions([])
    if (kind === 'saham') {
      fetch(`${API}/api/idx/emiten`)
        .then(r => r.json())
        .then(d => setOptions((d.companies || []).map((c: any) => ({ value: c.code, label: c.name, hint: c.code }))))
        .catch(() => setOptions([]))
    } else if (kind === 'crypto') {
      fetch(`${API}/api/crypto/top?limit=100`)
        .then(r => r.json())
        .then(d => setOptions((d.coins || []).map((c: any) => ({ value: c.id, label: c.name, hint: c.symbol }))))
        .catch(() => setOptions([]))
    } else if (kind === 'reksadana') {
      setOptions(REKSADANA_HINTS)
    } else if (kind === 'obligasi') {
      setOptions(OBLIGASI_HINTS)
    } else if (kind === 'logam') {
      setOptions(LOGAM_HINTS)
    }
  }, [kind])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options.slice(0, 20)
    return options
      .filter(o => o.value.toLowerCase().includes(q) || o.label.toLowerCase().includes(q))
      .slice(0, 20)
  }, [options, query])

  return (
    <div className="space-y-3">
      <label className="block text-[13px]">
        Tipe aset
        <select
          value={kind}
          onChange={e => setKind(e.target.value as AssetKind)}
          className="vn-input mt-1"
        >
          {Object.entries(KIND_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </label>

      <div className="block text-[13px] relative">
        <label>Simbol / kode (cari atau pilih)</label>
        <input
          value={symbol || query}
          onChange={e => {
            setSymbol('')
            setQuery(e.target.value)
            setOpenDropdown(true)
          }}
          onFocus={() => setOpenDropdown(true)}
          placeholder={
            kind === 'saham'
              ? 'BBCA, GOTO, AADI…'
              : kind === 'crypto'
              ? 'bitcoin, ethereum…'
              : kind === 'reksadana'
              ? 'Cari produk reksadana…'
              : kind === 'obligasi'
              ? 'FR0096, ORI024…'
              : 'ANTAM 5g, UBS 10g…'
          }
          className="vn-input mt-1"
        />
        {openDropdown && filtered.length > 0 && (
          <ul className="absolute z-20 left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white border border-[var(--vn-line)] rounded-2xl shadow-lg">
            {filtered.map(o => (
              <li key={o.value}>
                <button
                  type="button"
                  onClick={() => {
                    setSymbol(o.value)
                    setQuery('')
                    setOpenDropdown(false)
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-[var(--vn-cream)] flex justify-between items-center text-[13px]"
                >
                  <span>
                    <span className="font-mono text-[12px] font-bold text-[var(--vn-forest-dark)]">{o.value}</span>
                    <span className="text-[var(--vn-muted)] ml-2">{o.label}</span>
                  </span>
                  {o.hint && <span className="text-[11px] text-[var(--vn-muted)]">{o.hint}</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <label className="block text-[13px]">
        Jumlah unit
        <input
          type="number"
          value={amount || ''}
          onChange={e => setAmount(Number(e.target.value))}
          className="vn-input mt-1"
        />
      </label>
      <div className="block text-[13px]">
        <label>Cost basis per unit (Rp)</label>
        <div className="mt-1">
          <MoneyInput value={costBasis || 0} onChange={v => setCostBasis(v || undefined)} />
        </div>
      </div>
      <button
        onClick={() => {
          if (!symbol || !amount) return
          onAdd({ kind, symbol, amount, costBasis })
          setSymbol('')
          setAmount(0)
          setCostBasis(undefined)
        }}
        className="vn-btn vn-btn-primary w-full"
      >
        Simpan
      </button>
    </div>
  )
}

const REKSADANA_HINTS = [
  { value: 'RDPU', label: 'Reksadana Pasar Uang' },
  { value: 'RDPT', label: 'Reksadana Pendapatan Tetap' },
  { value: 'RDC', label: 'Reksadana Campuran' },
  { value: 'RDS', label: 'Reksadana Saham' },
  { value: 'RDI', label: 'Reksadana Indeks' },
]

const OBLIGASI_HINTS = [
  { value: 'FR0096', label: 'SUN FR0096 (Fixed Rate)' },
  { value: 'FR0098', label: 'SUN FR0098 (Fixed Rate)' },
  { value: 'ORI024', label: 'Obligasi Negara Ritel 024' },
  { value: 'SBR012', label: 'Savings Bond Ritel 012' },
  { value: 'SR020', label: 'Sukuk Ritel 020' },
]

const LOGAM_HINTS = [
  { value: 'ANTAM-1G', label: 'Emas Antam 1 gram' },
  { value: 'ANTAM-5G', label: 'Emas Antam 5 gram' },
  { value: 'ANTAM-10G', label: 'Emas Antam 10 gram' },
  { value: 'UBS-1G', label: 'Emas UBS 1 gram' },
  { value: 'UBS-10G', label: 'Emas UBS 10 gram' },
  { value: 'SILVER-100G', label: 'Perak 100 gram' },
]

/* ============================================================== */
/* TujuanForm                                                       */
/* ============================================================== */

function TujuanForm({ onAdd }: { onAdd: (t: Omit<Tujuan, 'id'>) => void }) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState<Tujuan['category']>('asset')
  const [target, setTarget] = useState(0)
  return (
    <div className="grid sm:grid-cols-4 gap-2 items-end">
      <label className="text-[12px]">
        Nama tujuan
        <input value={name} onChange={e => setName(e.target.value)} placeholder="iPhone 16, DP rumah, …" className="vn-input mt-1" />
      </label>
      <label className="text-[12px]">
        Kategori
        <select value={category} onChange={e => setCategory(e.target.value as Tujuan['category'])} className="vn-input mt-1">
          {Object.entries(TUJUAN_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v.icon} {v.label}</option>
          ))}
        </select>
      </label>
      <label className="text-[12px]">
        Target (Rp)
        <input type="number" value={target || ''} onChange={e => setTarget(Number(e.target.value))} className="vn-input mt-1" />
      </label>
      <button
        onClick={() => {
          if (!name.trim() || !target) return
          onAdd({ name: name.trim(), category, target, amount: 0, isComplete: false, isUsed: false })
          setName('')
          setTarget(0)
        }}
        className="vn-btn vn-btn-primary w-full"
      >
        Tambah
      </button>
    </div>
  )
}

/* ============================================================== */
/* CashflowForm                                                     */
/* ============================================================== */

function CashflowForm({ onAdd }: { onAdd: (e: Omit<CashflowEntry, 'id'>) => void }) {
  const today = new Date().toISOString().slice(0, 10)
  const [date, setDate] = useState(today)
  const [type, setType] = useState<CashflowEntry['type']>('expense')
  const [category, setCategory] = useState('')
  const [amount, setAmount] = useState(0)
  const [note, setNote] = useState('')
  return (
    <div className="grid sm:grid-cols-[auto_auto_1fr_auto_auto_auto] gap-2 items-end">
      <label className="text-[12px]">
        Tanggal
        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="vn-input mt-1" />
      </label>
      <label className="text-[12px]">
        Tipe
        <select value={type} onChange={e => setType(e.target.value as CashflowEntry['type'])} className="vn-input mt-1">
          <option value="income">Pemasukan</option>
          <option value="expense">Pengeluaran</option>
        </select>
      </label>
      <label className="text-[12px]">
        Kategori
        <input value={category} onChange={e => setCategory(e.target.value)} placeholder="Gaji, makan, transport…" className="vn-input mt-1" />
      </label>
      <label className="text-[12px]">
        Nominal
        <input type="number" value={amount || ''} onChange={e => setAmount(Number(e.target.value))} className="vn-input mt-1" />
      </label>
      <label className="text-[12px]">
        Catatan
        <input value={note} onChange={e => setNote(e.target.value)} className="vn-input mt-1" />
      </label>
      <button
        onClick={() => {
          if (!category || !amount) return
          onAdd({ date, type, category, amount, note: note || undefined })
          setCategory('')
          setAmount(0)
          setNote('')
        }}
        className="vn-btn vn-btn-primary"
      >
        Catat
      </button>
    </div>
  )
}
