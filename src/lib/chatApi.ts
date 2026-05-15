import { getPin } from './auth'

export type ChatMessage = { role: 'user' | 'assistant'; content: string }
export type ToolLog = { name: string; args: Record<string, unknown>; result: unknown }

const API_BASE = import.meta.env.VITE_API_URL || ''

const HIGHLIGHT_KEY = 'vnansial-ai-highlights'

export async function sendAgentChat(
  messages: ChatMessage[],
  opts: { agentId?: string; sessionId?: number } = {},
): Promise<{
  message: string
  toolCalls?: ToolLog[]
  agentId?: string
  error?: string
}> {
  const pin = getPin()
  const res = await fetch(`${API_BASE}/api/agent/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(pin ? { 'x-vnansial-pin': pin } : {}),
    },
    body: JSON.stringify({
      messages: messages.filter(m => m.role === 'user' || m.role === 'assistant'),
      pin: pin || undefined,
      agentId: opts.agentId,
      sessionId: opts.sessionId,
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Gagal menghubungi asisten')
  if (data.toolCalls?.length) stashHighlights(data.toolCalls as ToolLog[])
  return data
}

export function emitToolToasts(toolCalls: ToolLog[]) {
  for (const t of toolCalls) {
    window.dispatchEvent(
      new CustomEvent('vn-tool', { detail: { name: t.name } }),
    )
  }
}

export async function checkApiHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/health`)
    const d = await res.json()
    return Boolean(d.ok)
  } catch {
    return false
  }
}

/**
 * Inspect tool results and remember which entities the AI just
 * recommended. Pages read these on mount to add a "AI memilih ini"
 * highlight to the matching card.
 */
function stashHighlights(toolCalls: ToolLog[]) {
  if (typeof sessionStorage === 'undefined') return
  const highlights: Record<string, string[]> = JSON.parse(
    sessionStorage.getItem(HIGHLIGHT_KEY) || '{}',
  )

  for (const t of toolCalls) {
    const r = t.result as any
    if (!r) continue

    if (t.name === 'recommend_insurance' && Array.isArray(r.recommendations)) {
      highlights.insurance = r.recommendations.map((x: any) => x.type)
    }
    if (t.name === 'list_insurance_companies' && Array.isArray(r.companies)) {
      highlights.insuranceIds = r.companies.slice(0, 4).map((x: any) => x.id)
    }
    if (t.name === 'assess_crypto_scam_risk' && r.coin?.id) {
      highlights.crypto = [r.coin.id]
    }
    if (t.name === 'get_idx_company' && r.code) {
      highlights.emiten = [r.code]
    }
    if (t.name === 'check_investment_company' && r.company?.name) {
      highlights.ojk = [String(r.company.name).toLowerCase()]
    }
  }

  sessionStorage.setItem(HIGHLIGHT_KEY, JSON.stringify(highlights))
  window.dispatchEvent(new CustomEvent('vn-highlights', { detail: highlights }))
}

export function readHighlights(): Record<string, string[]> {
  try {
    return JSON.parse(sessionStorage.getItem(HIGHLIGHT_KEY) || '{}')
  } catch {
    return {}
  }
}

export function clearHighlights() {
  sessionStorage.removeItem(HIGHLIGHT_KEY)
  window.dispatchEvent(new CustomEvent('vn-highlights', { detail: {} }))
}
