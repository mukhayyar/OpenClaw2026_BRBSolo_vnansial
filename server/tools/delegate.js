/**
 * ask_other_agent — multi-agent delegation. Runs a short single-turn
 * conversation with another preset and returns its reply. Used when the
 * primary agent decides a specialist would answer better.
 *
 * To keep latency bounded and prevent infinite recursion, sub-agents
 * cannot themselves delegate; we strip the delegate tool from sub-loops.
 */

import { findAgent, AGENT_PRESETS } from '../agent/presets.js'
import { runAgentChat } from '../agent/loop.js'

export async function askOtherAgent({ agentId, question, pin } = {}) {
  if (!agentId || !question) {
    return { error: 'agentId & question wajib.' }
  }
  const agent = findAgent(agentId)
  if (!agent) {
    return { error: `agentId tidak dikenal. Pilihan: ${AGENT_PRESETS.map(a => a.id).join(', ')}` }
  }

  // Prevent recursion: strip the delegate tool from this sub-call's tool whitelist
  const subAgent = { ...agent }
  if (Array.isArray(subAgent.tools)) {
    subAgent.tools = subAgent.tools.filter(t => t !== 'ask_other_agent')
  }

  try {
    const result = await runAgentChat(
      [{ role: 'user', content: String(question).slice(0, 4000) }],
      { agent: subAgent, pin: pin || null },
    )
    return {
      ok: true,
      agentId: agent.id,
      agentName: agent.name,
      reply: result.message,
      toolCalls: (result.toolCalls || []).map(t => ({ name: t.name })),
      instruction:
        `Gunakan jawaban dari agent ${agent.name} di atas sebagai konteks. ` +
        `Kamu boleh meringkasnya, mengutipnya, atau menggabungkan dengan jawabanmu sendiri.`,
    }
  } catch (err) {
    return { error: err.message || 'sub-agent failed' }
  }
}
