import { createOpenAIClient, getAgentCompletionParams } from '../lib/openai.js'
import { SYSTEM_PROMPT } from './systemPrompt.js'
import { TOOL_DEFINITIONS } from '../tools/definitions.js'
import { runTool } from '../tools/runner.js'

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
 */
async function executeToolCalls(toolCalls, toolCallsLog, conversation) {
  for (const call of toolCalls) {
    const name = call.function?.name
    let args = {}
    try {
      args = JSON.parse(call.function?.arguments || '{}')
    } catch {
      args = {}
    }

    let result
    try {
      result = await runTool(name, args)
    } catch (err) {
      result = { error: err.message, details: err.data }
    }

    toolCallsLog.push({ name, args, result })

    conversation.push({
      role: 'tool',
      tool_call_id: call.id,
      content: JSON.stringify(result),
    })
  }
}

export async function runAgentChat(messages, options = {}) {
  const openai = options.openai ?? createOpenAIClient()
  const conversation = [{ role: 'system', content: SYSTEM_PROMPT }, ...messages]
  const toolCallsLog = []
  const params = getAgentCompletionParams()

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const request = {
      ...params,
      messages: conversation,
      tools: TOOL_DEFINITIONS,
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
      }
    }

    await executeToolCalls(toolCalls, toolCallsLog, conversation)
  }

  return {
    message: 'Maaf, percakapan terlalu panjang. Coba pertanyaan yang lebih spesifik.',
    toolCalls: toolCallsLog,
    truncated: true,
    model: params.model,
  }
}
