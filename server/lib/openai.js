import OpenAI from 'openai'
import { formatAgentError } from './errors.js'

const DEFAULT_MODEL = 'qwen3.6-flash'
const DEFAULT_BASE_URL = 'https://ai.sumopod.com/v1'

export function createOpenAIClient() {
  const apiKey = process.env.SUMOPOD_API_KEY
  if (!apiKey) {
    throw new Error('SUMOPOD_API_KEY is not set in .env')
  }
  return new OpenAI({
    apiKey,
    baseURL: process.env.SUMOPOD_BASE_URL || DEFAULT_BASE_URL,
  })
}

export function getModel() {
  return process.env.SUMOPOD_MODEL || DEFAULT_MODEL
}

export function getAgentCompletionParams() {
  return {
    model: getModel(),
    temperature: 0.4,
    max_tokens: 2048,
  }
}

/** Lightweight connectivity check — no API key in response. */
export async function testSumoPodPing() {
  if (!process.env.SUMOPOD_API_KEY) {
    return {
      ok: false,
      configured: false,
      model: getModel(),
      error: 'SUMOPOD_API_KEY not set',
    }
  }

  const openai = createOpenAIClient()
  const model = getModel()

  try {
    const response = await openai.chat.completions.create({
      model,
      messages: [{ role: 'user', content: 'Reply with exactly: pong' }],
      max_tokens: 16,
      temperature: 0,
    })
    const reply = response.choices[0]?.message?.content?.trim() || ''
    return {
      ok: true,
      configured: true,
      model,
      reply: reply.slice(0, 80),
      usage: response.usage,
    }
  } catch (err) {
    return {
      ok: false,
      configured: true,
      model,
      ...formatAgentError(err),
    }
  }
}
