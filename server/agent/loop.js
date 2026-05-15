import { createOpenAIClient, getModel } from '../lib/openai.js'
import { SYSTEM_PROMPT } from './systemPrompt.js'
import { TOOL_DEFINITIONS } from '../tools/definitions.js'
import { runTool } from '../tools/runner.js'

const MAX_ITERATIONS = 8

export async function runAgentChat(messages) {
  const openai = createOpenAIClient()
  const conversation = [{ role: 'system', content: SYSTEM_PROMPT }, ...messages]
  const toolCallsLog = []

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const response = await openai.chat.completions.create({
      model: getModel(),
      messages: conversation,
      tools: TOOL_DEFINITIONS,
      tool_choice: 'auto',
      temperature: 0.6,
      max_tokens: 1200,
    })

    const choice = response.choices[0]
    const assistantMessage = choice.message
    conversation.push(assistantMessage)

    const toolCalls = assistantMessage.tool_calls
    if (!toolCalls?.length) {
      return {
        message: assistantMessage.content || '',
        toolCalls: toolCallsLog,
        usage: response.usage,
      }
    }

    for (const call of toolCalls) {
      const name = call.function.name
      let args = {}
      try {
        args = JSON.parse(call.function.arguments || '{}')
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

  return {
    message: 'Maaf, percakapan terlalu panjang. Coba pertanyaan yang lebih spesifik.',
    toolCalls: toolCallsLog,
    truncated: true,
  }
}
