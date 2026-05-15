import { createOpenAIClient, getAgentCompletionParams } from '../lib/openai.js'
import { SYSTEM_PROMPT } from './systemPrompt.js'
import { TOOL_DEFINITIONS } from '../tools/definitions.js'
import { runTool } from '../tools/runner.js'
import { findAgent } from './presets.js'

const MAX_ITERATIONS = 8

function normalizeAssistantMessage(msg) {
  if (!msg) return { role: 'assistant', content: '' }
  const out = {
    role: 'assistant',
    content: msg.content ?? null,
  }
  if (msg.tool_calls?.length) {
    out.tool_calls = msg.tool_calls.map(tc => ({
      id: tc.id,
      type: 'function',
      function: {
        name: tc.function?.name || '',
        arguments:
          typeof tc.function?.arguments === 'string'
            ? tc.function.arguments
            : JSON.stringify(tc.function?.arguments ?? {}),
      },
    }))
  }
  return out
}

/**
 * Run tool calls one-by-one (Qwen / flash models may not handle parallel tools well).
 *
 * The `ctx.pin` is auto-injected into any tool args missing one — so the
 * agent doesn't need to pass it explicitly (and the user doesn't have to
 * paste their PIN in every message). Tools that don't need a PIN just
 * ignore the extra field.
 *
 * If `ctx.onProgress` is supplied, it's invoked at lifecycle moments
 * ('thinking', 'tool_start', 'tool_done') so the caller can stream
 * status updates (e.g. progressive Telegram message edits).
 */
async function executeToolCalls(toolCalls, toolCallsLog, conversation, ctx = {}) {
  for (const call of toolCalls) {
    const name = call.function?.name
    let args = {}
    try {
      args = JSON.parse(call.function?.arguments || '{}')
    } catch {
      args = {}
    }

    if (ctx.pin && args.pin === undefined) {
      args = { ...args, pin: ctx.pin }
    }

    const safeArgs = { ...args }
    if (safeArgs.pin) safeArgs.pin = '[redacted]'

    if (typeof ctx.onProgress === 'function') {
      try { await ctx.onProgress({ phase: 'tool_start', name, args: safeArgs }) } catch {}
    }

    let result
    try {
      result = await runTool(name, args)
    } catch (err) {
      result = { error: err.message, details: err.data }
    }

    toolCallsLog.push({ name, args: safeArgs, result })

    if (typeof ctx.onProgress === 'function') {
      try {
        await ctx.onProgress({
          phase: 'tool_done',
          name,
          ok: !(result && result.error),
        })
      } catch {}
    }

    conversation.push({
      role: 'tool',
      tool_call_id: call.id,
      content: JSON.stringify(result),
    })
  }
}

export async function runAgentChat(messages, options = {}) {
  const openai = options.openai ?? createOpenAIClient()
  const ctx = { pin: options.pin || null, onProgress: options.onProgress || null }
  const agent = options.agent || findAgent(options.agentId || 'generalis')
  if (typeof ctx.onProgress === 'function') {
    try { await ctx.onProgress({ phase: 'thinking' }) } catch {}
  }
  const baseExtra = ctx.pin
    ? `Konteks: user sudah unlock dengan PIN — kamu boleh memanggil SEMUA tool portofolio, cashflow, health, dan data.

PENTING: Kamu HARUS proaktif menyimpan data user ke database. Jangan cuma kasih saran — langsung panggil tool untuk simpan! Setiap user sebut nominal uang (gaji, pengeluaran, transaksi) → save_cashflow_entry. Setiap user cerita kondisi keuangan → find_user_data dulu untuk paham konteks (tapi jangan diulang-ulang). Setiap user sebut aset baru → add_portfolio_holding. Jadilah asisten yang BENERAN menyimpan dan mengelola data, bukan cuma ngomong.

JANGAN PERNAH meminta user menyebutkan PIN mereka. PIN sudah ada di sistem dan akan otomatis diisi ke setiap tool call. Kalau ada tool yang minta field "pin", kamu TIDAK PERLU mengisinya — sistem akan inject otomatis. Cukup sebut argumen lainnya saja (kind, symbol, amount, dll).`
    : `Konteks: user belum unlock PIN (VNANSIAL_PIN belum di-set di server). Kamu TETAP bisa bantu dengan tool yang tidak butuh PIN (cek investasi, kalkulator, market quote, analisis, dll). Jika user minta akses data pribadi (portofolio, cashflow, health history), jelaskan bahwa admin server perlu mengatur VNANSIAL_PIN dulu — SARAN ke user untuk set PIN di halaman web /settings. JANGAN minta user menyebutkan PIN di chat.`
  const systemPrompt = [SYSTEM_PROMPT, agent?.prompt || agent?.system_prompt || null, baseExtra]
    .filter(Boolean)
    .join('\n\n')
  // Optional tool whitelist per agent
  let toolDefs = TOOL_DEFINITIONS
  const allowed = agent?.tools
  if (Array.isArray(allowed) && allowed.length) {
    toolDefs = TOOL_DEFINITIONS.filter(t => allowed.includes(t.function?.name))
  }
  const conversation = [{ role: 'system', content: systemPrompt }, ...messages]
  const toolCallsLog = []
  const params = getAgentCompletionParams()

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const request = {
      ...params,
      messages: conversation,
      tools: toolDefs,
      tool_choice: 'auto',
    }

    const response = await openai.chat.completions.create(request)

    const choice = response.choices[0]
    const assistantMessage = normalizeAssistantMessage(choice?.message)
    conversation.push(assistantMessage)

    const toolCalls = assistantMessage.tool_calls
    if (!toolCalls?.length) {
      return {
        message: assistantMessage.content || '',
        toolCalls: toolCallsLog,
        usage: response.usage,
        model: params.model,
        agentId: agent?.id || null,
      }
    }

    await executeToolCalls(toolCalls, toolCallsLog, conversation, ctx)
  }

  return {
    message: 'Maaf, percakapan terlalu panjang. Coba pertanyaan yang lebih spesifik.',
    toolCalls: toolCallsLog,
    truncated: true,
    model: params.model,
  }
}
