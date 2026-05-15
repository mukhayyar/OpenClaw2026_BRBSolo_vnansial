import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import PageShell from '../components/PageShell'
import Bento from '../components/Bento'
import PinGate from '../components/PinGate'
import MoneyInput from '../components/MoneyInput'
import Pagination from '../components/Pagination'
import ConfirmModal from '../components/ConfirmModal'
import { pinHeader, getPin } from '../lib/auth'
import { usePortfolioStore } from '../stores/portfolioStore'
import { usePortfolioSync, fetchLivePrices } from '../lib/queries'
import type { AssetKind, Holding, Buffer, Tujuan, CashflowEntry, CashflowRule } from '../stores/portfolioStore'

const API = import.meta.env.VITE_API_URL || ''

const CURRENCIES = ['IDR', 'USD', 'EUR', 'SGD', 'JPY', 'AUD', 'GBP', 'CNY'] as const
const FX_TO_IDR_FALLBACK: Record<string, number> = {
  IDR: 1, USD: 16000, EUR: 17400, SGD: 11800, JPY: 102, AUD: 10500, GBP: 20300, CNY: 2200,
}

const KIND_LABEL: Record<AssetKind, string> = {
  saham: 'Saham',
  crypto: 'Crypto',
  reksadana: 'Reksadana',
  obligasi: 'Obligasi',
  logam: 'Logam mulia',
  cash: 'Cash (mata uang)',
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
  const {
    holdings, buffers, tujuan, cashflow, debts, cashflowRules,
    livePrices, fxRate, syncing,
    setLivePrices,
    addHolding, removeHolding, updateBuffer,
    addTujuan, updateTujuan, removeTujuan,
    addCash, removeCash,
    addDebt, removeDebt,
    addCashflowRule, toggleCashflowRule, removeCashflowRule,
  } = usePortfolioStore()

  const { refetch } = usePortfolioSync()
  const [page, setPage] = useState(1)
  const [cashPage, setCashPage] = useState(1)
  const PAGE_SIZE = 10

  const [confirm, setConfirm] = useState<{
    title: string; message: string; action: () => void
  } | null>(null)

  useEffect(() => {
    if (holdings.length > 0) {
      fetchLivePrices(holdings, fxRate).then((results) => {
        const prices: Record<string, { price: number; currency: string }> = {}
        for (const r of results) {
          if (r.status === 'fulfilled' && r.value) {
            prices[r.value.key] = { price: r.value.price, currency: r.value.currency }
          }
        }
        setLivePrices(prices)
      })
    }
  }, [holdings, fxRate])

  const liveValue = useMemo(() => {
    return holdings.reduce((sum, h) => {
      const live = livePrices[`${h.kind}:${h.symbol}`]
      if (!live) return sum + (h.costBasis || 0) * h.amount
      const ccy = live.currency
      if (h.kind === 'cash') {
        return sum + h.amount * live.price
      }
      const idr = ccy === 'IDR' ? live.price : live.price * (ccy === 'USD' ? fxRate : (FX_TO_IDR_FALLBACK[ccy] || fxRate))
      return sum + idr * h.amount
    }, 0)
  }, [holdings, livePrices, fxRate])

  const liveValueUsd = useMemo(() => liveValue / (fxRate || 16000), [liveValue, fxRate])

  const totalCost = useMemo(
    () => holdings.reduce((sum, h) => sum + (h.costBasis || 0) * h.amount, 0),
    [holdings],
  )

  const totalBuffer = useMemo(
    () => buffers.reduce((sum, b) => sum + b.amount, 0),
    [buffers],
  )

  const totalTujuan = useMemo(
    () => tujuan.filter(t => !t.isUsed).reduce((sum, t) => sum + t.amount, 0),
    [tujuan],
  )

  const totalDebt = useMemo(
    () => debts.reduce((sum, d) => sum + Number(d.remaining || 0), 0),
    [debts],
  )
  const totalDebtMonthly = useMemo(
    () => debts.reduce((sum, d) => sum + Number(d.monthlyPayment || 0), 0),
    [debts],
  )

  const monthlyCashflow = useMemo(() => {
    const now = new Date()
    const month = now.toISOString().slice(0, 7)
    const monthEntries = cashflow.filter(c => c.date && c.date.startsWith(month))
    const income = monthEntries.filter(c => c.type === 'income').reduce((s, c) => s + c.amount, 0)
    const expense = monthEntries.filter(c => c.type === 'expense').reduce((s, c) => s + c.amount, 0)
    return { income, expense, net: income - expense }
  }, [cashflow])

  const profit = liveValue - totalCost

  return (
    <>
      {syncing && (
        <p className="text-[12px] text-[var(--vn-muted)] mb-3 flex items-center gap-2">
          <span className="vn-dot vn-pulse" /> Menyinkronkan ke SQLite…
        </p>
      )}

      <div className="mb-4 px-4 py-2 rounded-full bg-[var(--vn-cream)] inline-flex items-center gap-3 text-[12px]">
        <span className="vn-dot vn-pulse" />
        <span className="font-mono">USD/IDR <strong className="text-[var(--vn-forest-dark)]">{fxRate.toLocaleString('id-ID')}</strong></span>
        <span className="text-[var(--vn-muted)]">· dipakai untuk konversi cash & crypto USD</span>
      </div>

      {/* Summary tiles */}
      <div className="grid lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        <Bento padding="lg" tone="forest">
          <p className="vn-eyebrow !text-[var(--vn-mint)] mb-2">Nilai aset live</p>
          <p className="vn-display text-[36px] text-white">{fmt(liveValue)}</p>
          <p className="text-white/70 text-[12px] font-mono mt-1">
            ≈ ${liveValueUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })} USD
          </p>
          <p className={`text-[13px] mt-1 ${profit >= 0 ? 'text-[var(--vn-mint)]' : 'text-[var(--vn-red-soft)]'}`}>
            {profit >= 0 ? '↑' : '↓'} {fmt(Math.abs(profit))} vs cost basis
          </p>
        </Bento>
        <Bento padding="lg" tone="cream">
          <p className="vn-eyebrow mb-2">Buffer + tujuan</p>
          <p className="vn-display text-[36px] text-[var(--vn-forest-dark)]">{fmt(totalBuffer + totalTujuan)}</p>
          <p className="text-[13px] text-[var(--vn-ink-soft)] mt-1">
            {tujuan.filter(t => !t.isUsed).length} tujuan aktif
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
          <p className="vn-eyebrow !text-[var(--vn-mint)] mb-2">Net worth</p>
          <p className="vn-display text-[36px] text-white">{fmt(liveValue + totalBuffer + totalTujuan - totalDebt)}</p>
          <p className="text-white/55 text-[12px] mt-1">Aset live + buffer + tujuan − hutang</p>
        </Bento>
      </div>

      {/* Add holding + list */}
      <div className="grid lg:grid-cols-5 gap-4 sm:gap-6 mb-8">
        <Bento padding="lg" className="lg:col-span-2">
          <p className="vn-eyebrow mb-3">Tambah holding</p>
          <HoldingForm onAdd={addHolding} />
        </Bento>

        <Bento padding="lg" className="lg:col-span-3">
          <p className="vn-eyebrow mb-3">Holding aktif · live ({holdings.length})</p>
          {holdings.length === 0 ? (
            <p className="text-[var(--vn-muted)] text-[14px]">Belum ada holding.</p>
          ) : (
            <ul className="space-y-2">
              {holdings.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(h => {
                const live = livePrices[`${h.kind}:${h.symbol}`]
                const liveValueIDR = live
                  ? (live.currency === 'IDR' ? live.price : live.price * fxRate) * h.amount
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
                      onClick={() => setConfirm({
                        title: 'Hapus holding',
                        message: `Hapus ${h.symbol} (${KIND_LABEL[h.kind]}) dari portofolio?`,
                        action: () => removeHolding(h.id),
                      })}
                      className="text-[12px] text-[var(--vn-red)] hover:underline"
                    >
                      Hapus
                    </button>
                  </li>
                )
              })}
        </ul>
      )}
    </Bento>
  </div>

  {/* Buffers */}
      <Bento padding="lg" className="mb-8">
        <p className="vn-eyebrow mb-3">Dana darurat & money buffer</p>
        <h3 className="vn-headline text-[22px] mb-5">Cadangan likuid kamu.</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {buffers.map(b => {
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
          Tandai <strong>selesai</strong> ketika target tercapai, dan <strong>terpakai</strong> setelah dana benar-benar digunakan.
        </p>
        <TujuanForm onAdd={addTujuan} />
        <div className="mt-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {tujuan.length === 0 && (
            <p className="text-[var(--vn-muted)] text-[14px] sm:col-span-2 lg:col-span-3">
              Belum ada tujuan. Tambah dari form di atas.
            </p>
          )}
          {tujuan.map(t => {
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
                  <button
                    onClick={() => setConfirm({
                      title: 'Hapus tujuan',
                      message: `Hapus tujuan "${t.name}"?`,
                      action: () => removeTujuan(t.id),
                    })}
                    className="text-[11px] text-[var(--vn-red)] hover:underline"
                  >
                    Hapus
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div className="text-[11px]">
                    <label>Saldo</label>
                    <div className="mt-0.5">
                      <MoneyInput value={t.amount || 0} onChange={v => updateTujuan(t.id, { amount: v })} />
                    </div>
                  </div>
                  <div className="text-[11px]">
                    <label>Target</label>
                    <div className="mt-0.5">
                      <MoneyInput value={t.target || 0} onChange={v => updateTujuan(t.id, { target: v })} />
                    </div>
                  </div>
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

      {/* Hutang */}
      <DebtSection
        debts={debts}
        totalDebt={totalDebt}
        totalMonthly={totalDebtMonthly}
        onAdd={addDebt}
        onRemove={removeDebt}
        onRefresh={() => refetch()}
      />

      {/* Auto-cashflow rules */}
      <CashflowRulesSection
        rules={cashflowRules}
        onAdd={addCashflowRule}
        onToggle={toggleCashflowRule}
        onRemove={removeCashflowRule}
        onRefresh={() => refetch()}
      />

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
        <ul className="mt-5 space-y-2">
          {cashflow.length === 0 && (
            <p className="text-[var(--vn-muted)] text-[14px]">Belum ada catatan.</p>
          )}
          {cashflow.slice((cashPage - 1) * PAGE_SIZE, cashPage * PAGE_SIZE).map(c => (
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
              <button
                onClick={() => setConfirm({
                  title: 'Hapus catatan',
                  message: `Hapus catatan "${c.category}" Rp${c.amount.toLocaleString('id-ID')}?`,
                  action: () => removeCash(c.id),
                })}
                className="text-[11px] text-[var(--vn-red)] hover:underline"
              >
                Hapus
              </button>
            </li>
          ))}
        </ul>
        <Pagination page={cashPage} total={cashflow.length} pageSize={PAGE_SIZE} onChange={setCashPage} />
      </Bento>

      <ConfirmModal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm?.action()}
        title={confirm?.title || 'Konfirmasi'}
        message={confirm?.message || ''}
        variant="danger"
        confirmLabel="Ya, hapus"
        cancelLabel="Batal"
      />
    </>
  )
}

/* ============================================================== */
/* Debt section                                                     */
/* ============================================================== */

function DebtSection({
  debts, totalDebt, totalMonthly, onAdd, onRemove, onRefresh,
}: {
  debts: any[]
  totalDebt: number
  totalMonthly: number
  onAdd: (d: any) => Promise<void>
  onRemove: (id: number) => Promise<void>
  onRefresh: () => void
}) {
  const [name, setName] = useState('')
  const [kind, setKind] = useState('pinjaman')
  const [principal, setPrincipal] = useState(0)
  const [remaining, setRemaining] = useState(0)
  const [monthlyPayment, setMonthlyPayment] = useState(0)
  const [confirmDebt, setConfirmDebt] = useState<{ id: number; name: string } | null>(null)

  async function add() {
    if (!getPin()) return alert('Unlock PIN dulu untuk simpan ke server.')
    if (!name.trim() || !principal) return
    await onAdd({ name, kind, principal, remaining: remaining || principal, monthlyPayment })
    setName(''); setPrincipal(0); setRemaining(0); setMonthlyPayment(0)
    onRefresh()
  }

  return (
    <Bento padding="lg" className="mb-8">
      <div className="flex items-baseline justify-between mb-3">
        <p className="vn-eyebrow">Hutang</p>
        <p className="text-[12px] text-[var(--vn-muted)]">
          Total sisa <strong className="text-[var(--vn-red)]">{fmt(totalDebt)}</strong> · cicilan/bln <strong>{fmt(totalMonthly)}</strong>
        </p>
      </div>
      <h3 className="vn-headline text-[22px] mb-5">Liabilitas yang belum lunas.</h3>
      <div className="grid sm:grid-cols-5 gap-2 items-end mb-5">
        <input placeholder="Nama (KPR BCA, dll.)" value={name} onChange={e => setName(e.target.value)} className="vn-input" />
        <select value={kind} onChange={e => setKind(e.target.value)} className="vn-input">
          <option value="pinjaman">Pinjaman</option>
          <option value="kpr">KPR</option>
          <option value="kartu_kredit">Kartu Kredit</option>
          <option value="pinjol">Pinjol</option>
          <option value="kpa">KPA</option>
        </select>
        <MoneyInput value={principal} onChange={setPrincipal} placeholder="Pokok" />
        <MoneyInput value={remaining} onChange={setRemaining} placeholder="Sisa" />
        <MoneyInput value={monthlyPayment} onChange={setMonthlyPayment} placeholder="Cicilan/bln" />
      </div>
      <button onClick={add} className="vn-btn vn-btn-primary mb-5">Tambah hutang</button>

      {debts.length === 0 ? (
        <p className="text-[var(--vn-muted)] text-[14px]">Belum ada hutang tercatat.</p>
      ) : (
        <ul className="space-y-2">
          {debts.map((d: any) => (
            <li key={d.id} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 bg-[var(--vn-bg-deep)] rounded-2xl px-4 py-3">
              <div>
                <p className="font-semibold text-[14px]">{d.name}</p>
                <p className="text-[11px] text-[var(--vn-muted)]">{d.kind}</p>
              </div>
              <p className="text-[13px] text-[var(--vn-red)]">{fmt(d.remaining)}</p>
              <p className="text-[12px] text-[var(--vn-muted)]">{d.monthly_payment ? `${fmt(d.monthly_payment)}/bln` : '—'}</p>
              <button
                onClick={() => setConfirmDebt({ id: d.id, name: d.name })}
                className="text-[12px] text-[var(--vn-red)] hover:underline">Hapus</button>
            </li>
          ))}
        </ul>
      )}
      <ConfirmModal
        open={!!confirmDebt}
        onClose={() => setConfirmDebt(null)}
        onConfirm={() => {
          if (confirmDebt) onRemove(confirmDebt.id)
          setConfirmDebt(null)
        }}
        title="Hapus hutang"
        message={confirmDebt ? `Hapus "${confirmDebt.name}" dari daftar hutang?` : ''}
        variant="danger"
        confirmLabel="Ya, hapus"
        cancelLabel="Batal"
      />
    </Bento>
  )
}

/* ============================================================== */
/* Auto-cashflow rules section                                      */
/* ============================================================== */

function CashflowRulesSection({
  rules, onAdd, onToggle, onRemove, onRefresh,
}: {
  rules: CashflowRule[]
  onAdd: (r: any) => Promise<void>
  onToggle: (r: CashflowRule) => Promise<void>
  onRemove: (id: number) => Promise<void>
  onRefresh: () => void
}) {
  const [kind, setKind] = useState<'income' | 'expense'>('income')
  const [category, setCategory] = useState('')
  const [amount, setAmount] = useState(0)
  const [schedule, setSchedule] = useState<'daily' | 'weekly' | 'monthly'>('monthly')
  const [dayOfMonth, setDayOfMonth] = useState(25)
  const [confirmRule, setConfirmRule] = useState<{ id: number; name: string } | null>(null)

  async function add() {
    if (!getPin()) return alert('Unlock PIN dulu.')
    if (!category.trim() || !amount) return
    await onAdd({ kind, category, amount, schedule, dayOfMonth })
    setCategory(''); setAmount(0)
    onRefresh()
  }

  return (
    <Bento padding="lg" className="mb-8">
      <p className="vn-eyebrow mb-3">Auto cashflow (rutin)</p>
      <h3 className="vn-headline text-[22px] mb-2">Gaji, tagihan, cicilan otomatis tercatat.</h3>
      <p className="text-[12.5px] text-[var(--vn-muted)] mb-5">
        Cron daemon (setiap 30 detik) cek aturan ini dan kirim notifikasi Telegram saat jatuh tempo.
        Cocok untuk: gaji bulanan, tagihan listrik, internet, langganan, cicilan.
      </p>
      <div className="grid sm:grid-cols-6 gap-2 items-end mb-5">
        <select value={kind} onChange={e => setKind(e.target.value as any)} className="vn-input">
          <option value="income">Pemasukan</option>
          <option value="expense">Pengeluaran</option>
        </select>
        <input placeholder="Kategori (Gaji, Listrik)" value={category} onChange={e => setCategory(e.target.value)} className="vn-input sm:col-span-2" />
        <MoneyInput value={amount} onChange={setAmount} placeholder="Nominal" />
        <select value={schedule} onChange={e => setSchedule(e.target.value as any)} className="vn-input">
          <option value="daily">Harian</option>
          <option value="weekly">Mingguan</option>
          <option value="monthly">Bulanan</option>
        </select>
        {schedule === 'monthly' && (
          <input type="number" min={1} max={31} value={dayOfMonth} onChange={e => setDayOfMonth(Number(e.target.value))} className="vn-input" placeholder="Tgl" />
        )}
      </div>
      <button onClick={add} className="vn-btn vn-btn-primary mb-5">Tambah aturan</button>

      {rules.length === 0 ? (
        <p className="text-[var(--vn-muted)] text-[14px]">Belum ada aturan otomatis.</p>
      ) : (
        <ul className="space-y-2">
          {rules.map(r => (
            <li key={r.id} className={`grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-3 rounded-2xl px-4 py-3 ${r.active ? 'bg-[var(--vn-bg-deep)]' : 'bg-[var(--vn-bg-deep)] opacity-50'}`}>
              <span className={`text-[11px] uppercase tracking-wider px-2 py-0.5 rounded-full ${r.kind === 'income' ? 'bg-[var(--vn-cream)] text-[var(--vn-forest-dark)]' : 'bg-[var(--vn-red-soft)] text-[var(--vn-red)]'}`}>
                {r.kind === 'income' ? 'IN' : 'OUT'}
              </span>
              <div>
                <p className="text-[14px] font-medium">{r.category}</p>
                <p className="text-[11px] text-[var(--vn-muted)]">
                  {r.schedule} {r.day_of_month ? `· tgl ${r.day_of_month}` : ''} · {new Date(r.next_fire_at).toLocaleDateString('id-ID')}
                </p>
              </div>
              <p className={`text-[13px] font-semibold font-mono ${r.kind === 'income' ? 'text-[var(--vn-forest-dark)]' : 'text-[var(--vn-red)]'}`}>
                {r.kind === 'income' ? '+' : '−'}{fmt(r.amount)}
              </p>
              <button onClick={() => onToggle(r)} className="text-[11px] underline text-[var(--vn-forest)]">
                {r.active ? 'Pause' : 'Resume'}
              </button>
              <button
                onClick={() => setConfirmRule({ id: r.id, name: r.category })}
                className="text-[11px] text-[var(--vn-red)] hover:underline">Hapus</button>
            </li>
          ))}
        </ul>
      )}
      <ConfirmModal
        open={!!confirmRule}
        onClose={() => setConfirmRule(null)}
        onConfirm={() => {
          if (confirmRule) onRemove(confirmRule.id)
          setConfirmRule(null)
        }}
        title="Hapus aturan"
        message={confirmRule ? `Hapus aturan auto-cashflow "${confirmRule.name}"?` : ''}
        variant="danger"
        confirmLabel="Ya, hapus"
        cancelLabel="Batal"
      />
    </Bento>
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
    } else if (kind === 'cash') {
      setOptions(CURRENCIES.map(c => ({ value: c, label: c, hint: c })))
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
      <div className="text-[12px]">
        <label>Target</label>
        <div className="mt-1">
          <MoneyInput value={target} onChange={setTarget} />
        </div>
      </div>
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
      <div className="text-[12px]">
        <label>Nominal</label>
        <div className="mt-1">
          <MoneyInput value={amount} onChange={setAmount} />
        </div>
      </div>
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
