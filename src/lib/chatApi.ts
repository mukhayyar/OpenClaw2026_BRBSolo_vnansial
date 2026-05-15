export type ChatMessage = { role: 'user' | 'assistant'; content: string }
export type ToolLog = { name: string; args: Record<string, unknown>; result: unknown }

const API_BASE = import.meta.env.VITE_API_URL || ''

export async function sendAgentChat(messages: ChatMessage[]): Promise<{
  message: string
  toolCalls?: ToolLog[]
  error?: string
}> {
  const res = await fetch(`${API_BASE}/api/agent/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: messages.filter(m => m.role === 'user' || m.role === 'assistant'),
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Gagal menghubungi asisten')
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
