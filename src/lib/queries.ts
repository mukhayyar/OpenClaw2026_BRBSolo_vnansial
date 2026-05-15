import { useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { usePortfolioStore } from '../stores/portfolioStore'
import { getPin, pinHeader } from './auth'

const API = import.meta.env.VITE_API_URL || ''

export const PORTFOLIO_KEYS = {
  all: ['portfolio'] as const,
  holdings: ['portfolio', 'holdings'] as const,
  buffers: ['portfolio', 'buffers'] as const,
  debts: ['portfolio', 'debts'] as const,
  cashflowRules: ['portfolio', 'cashflowRules'] as const,
  cashflowEntries: ['portfolio', 'cashflowEntries'] as const,
  fx: ['portfolio', 'fx'] as const,
}

export function usePortfolioSync() {
  const store = usePortfolioStore()
  const pin = getPin()
  const queryClient = useQueryClient()
  const mounted = useRef(false)
  const lastAppliedRef = useRef(0)

  const query = useQuery({
    queryKey: PORTFOLIO_KEYS.all,
    queryFn: async () => {
      if (!pin) return null
      const [portfolioRes, debtsRes, rulesRes, entriesRes, fxRes] = await Promise.all([
        fetch(`${API}/api/me/portfolio`, { headers: pinHeader() }).then((r) => r.json()),
        fetch(`${API}/api/me/debts`, { headers: pinHeader() }).then((r) => r.json()),
        fetch(`${API}/api/me/cashflow-rules`, { headers: pinHeader() }).then((r) => r.json()),
        fetch(`${API}/api/me/cashflow-entries`, { headers: pinHeader() }).then((r) => r.json()),
        fetch(`${API}/api/market/fx`).then((r) => r.json()),
      ])
      return { portfolioRes, debtsRes, rulesRes, entriesRes, fxRes }
    },
    enabled: !!pin,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 30_000,
  })

  useEffect(() => {
    if (!query.data) return
    const { portfolioRes, debtsRes, rulesRes, entriesRes, fxRes } = query.data
    const now = Date.now()

    if (portfolioRes && !portfolioRes.error && Array.isArray(portfolioRes.holdings)) {
      const remoteHoldings = portfolioRes.holdings.map((h: any) => ({
        id: String(h.id),
        kind: h.kind,
        symbol: h.symbol,
        amount: h.amount,
        costBasis: h.cost_basis ?? undefined,
      }))
      const remoteBuffers = ['emergency', 'money_buffer'].map((k) => {
        const b = portfolioRes.buffers.find((x: any) => x.kind === k)
        return { kind: k, amount: b?.amount || 0, target: b?.target || 0 }
      })
      store.setHoldings(remoteHoldings)
      store.setBuffers(remoteBuffers as any)
    }
    if (debtsRes?.debts) store.setDebts(debtsRes.debts)
    if (rulesRes?.rules) store.setCashflowRules(rulesRes.rules)
    if (entriesRes?.entries) {
      store.setCashflow(entriesRes.entries.map((e: any) => ({ ...e, id: String(e.id) })))
    }
    if (fxRes?.rate) store.setFxRate(Number(fxRes.rate))
    store.saveToLocalStorage()
    lastAppliedRef.current = now
  }, [query.data])

  useEffect(() => {
    store.loadFromLocalStorage()
    if (pin) {
      store.syncFromServer()
    }
    mounted.current = true
  }, [pin])

  useEffect(() => {
    function handleSync() {
      queryClient.invalidateQueries({ queryKey: PORTFOLIO_KEYS.all })
      store.syncFromServer()
    }

    function handleTool(evt: Event) {
      const detail = (evt as CustomEvent).detail
      const name = detail?.name
      if (!name) return
      const modifyingTools = [
        'add_portfolio_holding', 'remove_portfolio_holding', 'update_money_buffer',
        'add_debt', 'update_debt', 'remove_debt',
        'create_cashflow_rule', 'toggle_cashflow_rule', 'delete_cashflow_rule',
        'save_cashflow_entry', 'delete_cashflow_entry',
        'save_health_score',
      ]
      if (modifyingTools.includes(name)) {
        handleSync()
      }
    }

    window.addEventListener('vn-portfolio-sync', handleSync)
    window.addEventListener('vn-tool', handleTool)
    window.addEventListener('focus', () => {
      if (lastAppliedRef.current && Date.now() - lastAppliedRef.current > 5000) {
        handleSync()
      }
    })
    return () => {
      window.removeEventListener('vn-portfolio-sync', handleSync)
      window.removeEventListener('vn-tool', handleTool)
    }
  }, [pin, store, queryClient])

  useEffect(() => {
    const unsub = usePortfolioStore.subscribe((state, prev) => {
      if (
        state.holdings !== prev.holdings ||
        state.buffers !== prev.buffers ||
        state.tujuan !== prev.tujuan ||
        state.cashflow !== prev.cashflow ||
        state.debts !== prev.debts
      ) {
        state.saveToLocalStorage()
      }
    })
    return unsub
  }, [])

  return { refetch: () => queryClient.invalidateQueries({ queryKey: PORTFOLIO_KEYS.all }) }
}

export function fetchLivePrices(holdings: { kind: string; symbol: string }[], fxRate: number) {
  return Promise.allSettled(
    holdings.map(async (h) => {
      try {
        if (h.kind === 'saham') {
          const sym = /^[A-Z]{2,5}$/.test(h.symbol) ? `${h.symbol}.JK` : h.symbol
          const res = await fetch(`${API}/api/market/quote?symbol=${encodeURIComponent(sym)}`)
          const data = await res.json()
          if (data?.regularMarketPrice) {
            return { key: `${h.kind}:${h.symbol}`, price: data.regularMarketPrice, currency: data.currency || 'IDR' }
          }
        } else if (h.kind === 'crypto') {
          const res = await fetch(`${API}/api/crypto/coin?id=${encodeURIComponent(h.symbol.toLowerCase())}`)
          const data = await res.json()
          if (data?.price) {
            return { key: `${h.kind}:${h.symbol}`, price: data.price, currency: 'USD' }
          }
        } else if (h.kind === 'cash') {
          const ccy = h.symbol.toUpperCase()
          const FX_TO_IDR_FALLBACK: Record<string, number> = {
            IDR: 1, USD: fxRate, EUR: 17400, SGD: 11800, JPY: 102, AUD: 10500, GBP: 20300, CNY: 2200,
          }
          const rate = FX_TO_IDR_FALLBACK[ccy] || 1
          return { key: `${h.kind}:${h.symbol}`, price: rate, currency: ccy }
        }
      } catch {}
      return null
    }),
  )
}
