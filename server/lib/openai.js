import OpenAI from 'openai'

export function createOpenAIClient() {
  const apiKey = process.env.SUMOPOD_API_KEY
  if (!apiKey) {
    throw new Error('SUMOPOD_API_KEY is not set in .env')
  }
  return new OpenAI({
    apiKey,
    baseURL: process.env.SUMOPOD_BASE_URL || 'https://ai.sumopod.com/v1',
  })
}

export function getModel() {
  return process.env.SUMOPOD_MODEL || 'gpt-4o-mini'
}
