import { create } from 'zustand'
import { getPin, pinHeader } from '../lib/auth'

const API = import.meta.env.VITE_API_URL || ''
const STORAGE_KEY = 'vnansial-portfolio-v3'

export type AssetKind = 'saham' | 'crypto' | 'reksadana' | 'obligasi' | 'logam' | 'cash'

export type Holding = {
  id: string
  kind: AssetKind
  symbol: string
  amount: number
  costBasis?: number
}

export type Buffer = {
  kind: 'emergency' | 'money_buffer'
  amount: number
  target: number
}

export type Tujuan = {
  id: string
  name: string
  category: 'asset' | 'phone' | 'home' | 'travel' | 'vehicle' | 'education' | 'other'
  amount: number
  target: number
  isComplete: boolean
  isUsed: boolean
}

export type CashflowEntry = {
  id: string
  date: string
  category: string
  type: 'income' | 'expense'
  amount: number
  note?: string
  source?: string
}

export type Debt = {
  id: number
  name: string
  kind: string
  principal: number
  remaining: number
  monthlyPayment?: number
  annualRate?: number
  dueDay?: number
}

export type CashflowRule = {
  id: number
  kind: 'income' | 'expense'
  category: string
  amount: number
  schedule: 'daily' | 'weekly' | 'monthly'
  day_of_month?: number
  active: number
  next_fire_at: number
  note?: string
}

export type LivePrice = { price: number; currency: string }

interface PortfolioState {
  holdings: Holding[]
  buffers: Buffer[]
  tujuan: Tujuan[]
  cashflow: CashflowEntry[]
  debts: Debt[]
  cashflowRules: CashflowRule[]
  livePrices: Record<string, LivePrice>
  fxRate: number
  syncing: boolean
  lastSync: number | null

  setHoldings: (holdings: Holding[]) => void
  setBuffers: (buffers: Buffer[]) => void
  setTujuan: (tujuan: Tujuan[]) => void
  setCashflow: (cashflow: CashflowEntry[]) => void
  setDebts: (debts: Debt[]) => void
  setCashflowRules: (rules: CashflowRule[]) => void
  setLivePrices: (prices: Record<string, LivePrice>) => void
  setFxRate: (rate: number) => void
  setSyncing: (s: boolean) => void

  addHolding: (h: Omit<Holding, 'id'>) => Promise<void>
  removeHolding: (id: string) => Promise<void>
  updateBuffer: (kind: Buffer['kind'], patch: Partial<Buffer>) => Promise<void>
  addTujuan: (t: Omit<Tujuan, 'id'>) => void
  updateTujuan: (id: string, patch: Partial<Tujuan>) => void
  removeTujuan: (id: string) => void
  addCash: (entry: Omit<CashflowEntry, 'id'>) => void
  removeCash: (id: string) => void
  addDebt: (d: Omit<Debt, 'id'>) => Promise<void>
  removeDebt: (id: number) => Promise<void>
  addCashflowRule: (r: Omit<CashflowRule, 'id' | 'active' | 'next_fire_at'> & { dayOfMonth?: number }) => Promise<void>
  toggleCashflowRule: (r: CashflowRule) => Promise<void>
  removeCashflowRule: (id: number) => Promise<void>

  syncFromServer: () => Promise<void>
  loadFromLocalStorage: () => void
  saveToLocalStorage: () => void
}

export const usePortfolioStore = create<PortfolioState>((set, get) => ({
  holdings: [],
  buffers: [
    { kind: 'emergency', amount: 0, target: 0 },
    { kind: 'money_buffer', amount: 0, target: 0 },
  ],
  tujuan: [],
  cashflow: [],
  debts: [],
  cashflowRules: [],
  livePrices: {},
  fxRate: 16000,
  syncing: false,
  lastSync: null,

  setHoldings: (holdings) => set({ holdings }),
  setBuffers: (buffers) => set({ buffers }),
  setTujuan: (tujuan) => set({ tujuan }),
  setCashflow: (cashflow) => set({ cashflow }),
  setDebts: (debts) => set({ debts }),
  setCashflowRules: (cashflowRules) => set({ cashflowRules }),
  setLivePrices: (livePrices) => set((s) => ({ livePrices: { ...s.livePrices, ...livePrices } })),
  setFxRate: (fxRate) => set({ fxRate }),
  setSyncing: (syncing) => set({ syncing }),

  addHolding: async (h) => {
    if (!h.symbol.trim() || h.amount <= 0) return
    const next: Holding = { ...h, symbol: h.symbol.toUpperCase().trim(), id: crypto.randomUUID() }
    set((s) => ({ holdings: [...s.holdings, next] }))
    if (!getPin()) return
    set({ syncing: true })
    await fetch(`${API}/api/me/portfolio/holding`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...pinHeader() },
      body: JSON.stringify(h),
    }).catch(() => {})
    set({ syncing: false })
  },

  removeHolding: async (id) => {
    const target = get().holdings.find((h) => h.id === id)
    set((s) => ({ holdings: s.holdings.filter((h) => h.id !== id) }))
    if (!target || !getPin()) return
    set({ syncing: true })
    await fetch(`${API}/api/me/portfolio/holding`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...pinHeader() },
      body: JSON.stringify({ kind: target.kind, symbol: target.symbol }),
    }).catch(() => {})
    set({ syncing: false })
  },

  updateBuffer: async (kind, patch) => {
    set((s) => {
      const buffers = s.buffers.map((b) => (b.kind === kind ? { ...b, ...patch } : b))
      return { buffers }
    })
    if (!getPin()) return
    set({ syncing: true })
    const b = get().buffers.find((x) => x.kind === kind)
    if (b) {
      await fetch(`${API}/api/me/portfolio/buffer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...pinHeader() },
        body: JSON.stringify(b),
      }).catch(() => {})
    }
    set({ syncing: false })
  },

  addTujuan: (t) => {
    if (!t.name.trim()) return
    set((s) => ({ tujuan: [...s.tujuan, { ...t, id: crypto.randomUUID() }] }))
  },
  updateTujuan: (id, patch) =>
    set((s) => ({ tujuan: s.tujuan.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),
  removeTujuan: (id) =>
    set((s) => ({ tujuan: s.tujuan.filter((t) => t.id !== id) })),

  addCash: (entry) => {
    if (!entry.amount) return
    set((s) => ({ cashflow: [{ ...entry, id: crypto.randomUUID() }, ...s.cashflow].slice(0, 200) }))
  },
  removeCash: (id) =>
    set((s) => ({ cashflow: s.cashflow.filter((c) => c.id !== id) })),

  addDebt: async (d) => {
    if (!getPin() || !d.name || !d.principal) return
    const res = await fetch(`${API}/api/me/debts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...pinHeader() },
      body: JSON.stringify(d),
    })
    if (res.ok) await get().syncFromServer()
  },
  removeDebt: async (id) => {
    if (!getPin()) return
    await fetch(`${API}/api/me/debts/${id}`, { method: 'DELETE', headers: pinHeader() })
    set((s) => ({ debts: s.debts.filter((d) => d.id !== id) }))
  },
  addCashflowRule: async (r) => {
    if (!getPin() || !r.category || !r.amount) return
    const res = await fetch(`${API}/api/me/cashflow-rules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...pinHeader() },
      body: JSON.stringify(r),
    })
    if (res.ok) await get().syncFromServer()
  },
  toggleCashflowRule: async (r) => {
    if (!getPin()) return
    await fetch(`${API}/api/me/cashflow-rules/${r.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...pinHeader() },
      body: JSON.stringify({ active: !r.active }),
    })
    set((s) => ({
      cashflowRules: s.cashflowRules.map((x) => (x.id === r.id ? { ...x, active: r.active ? 0 : 1 } : x)),
    }))
  },
  removeCashflowRule: async (id) => {
    if (!getPin()) return
    await fetch(`${API}/api/me/cashflow-rules/${id}`, { method: 'DELETE', headers: pinHeader() })
    set((s) => ({ cashflowRules: s.cashflowRules.filter((r) => r.id !== id) }))
  },

  syncFromServer: async () => {
    if (!getPin()) return
    set({ syncing: true })

    try {
      const [portfolioRes, debtsRes, rulesRes, entriesRes, fxRes] = await Promise.all([
        fetch(`${API}/api/me/portfolio`, { headers: pinHeader() }).then((r) => r.json()),
        fetch(`${API}/api/me/debts`, { headers: pinHeader() }).then((r) => r.json()),
        fetch(`${API}/api/me/cashflow-rules`, { headers: pinHeader() }).then((r) => r.json()),
        fetch(`${API}/api/me/cashflow-entries`, { headers: pinHeader() }).then((r) => r.json()),
        fetch(`${API}/api/market/fx`).then((r) => r.json()),
      ])

      if (!portfolioRes.error && Array.isArray(portfolioRes.holdings)) {
        const remoteHoldings: Holding[] = portfolioRes.holdings.map((h: any) => ({
          id: String(h.id),
          kind: h.kind,
          symbol: h.symbol,
          amount: h.amount,
          costBasis: h.cost_basis ?? undefined,
        }))
        const remoteBuffers: Buffer[] = ['emergency', 'money_buffer'].map((k) => {
          const b = portfolioRes.buffers.find((x: any) => x.kind === k)
          return { kind: k as Buffer['kind'], amount: b?.amount || 0, target: b?.target || 0 }
        })
        set({ holdings: remoteHoldings, buffers: remoteBuffers })
      }
      if (debtsRes.debts) set({ debts: debtsRes.debts })
      if (rulesRes.rules) set({ cashflowRules: rulesRes.rules })
      if (entriesRes.entries) {
        set({ cashflow: entriesRes.entries.map((e: any) => ({ ...e, id: String(e.id) })) })
      }
      if (fxRes?.rate) set({ fxRate: Number(fxRes.rate) })

      set({ lastSync: Date.now() })
    } catch {}

    set({ syncing: false })
  },

  loadFromLocalStorage: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      const parsed = raw ? JSON.parse(raw) : null
      if (parsed) {
        set({
          holdings: parsed.holdings || [],
          tujuan: parsed.tujuan || [],
          cashflow: parsed.cashflow || [],
        })
      }
    } catch {}
  },

  saveToLocalStorage: () => {
    const { holdings, buffers, tujuan, cashflow, debts } = get()
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ holdings, buffers, tujuan, cashflow, debts }))
    } catch {}
  },
}))
