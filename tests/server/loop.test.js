import { describe, it, expect, vi } from 'vitest'
import { runAgentChat } from '../../server/agent/loop.js'

describe('runAgentChat (mocked SumoPod)', () => {
  it('returns assistant message when no tools called', async () => {
    const mockCreate = vi.fn()
      .mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'Halo, ini jawaban tes.',
            },
          },
        ],
        usage: { total_tokens: 10 },
      })

    const openai = { chat: { completions: { create: mockCreate } } }

    const result = await runAgentChat(
      [{ role: 'user', content: 'halo' }],
      { openai },
    )

    expect(result.message).toContain('jawaban tes')
    expect(result.toolCalls).toHaveLength(0)
    expect(mockCreate).toHaveBeenCalledTimes(1)
  })

  it('executes tools sequentially then responds', async () => {
    const mockCreate = vi
      .fn()
      .mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: 'assistant',
              content: null,
              tool_calls: [
                {
                  id: 'call_1',
                  type: 'function',
                  function: {
                    name: 'check_investment_company',
                    arguments: JSON.stringify({ companyName: 'binomo' }),
                  },
                },
              ],
            },
          },
        ],
        usage: { total_tokens: 20 },
      })
      .mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'Binomo ilegal.',
            },
          },
        ],
        usage: { total_tokens: 30 },
      })

    const openai = { chat: { completions: { create: mockCreate } } }

    const result = await runAgentChat(
      [{ role: 'user', content: 'cek binomo' }],
      { openai },
    )

    expect(result.toolCalls).toHaveLength(1)
    expect(result.toolCalls[0].name).toBe('check_investment_company')
    expect(result.message).toContain('ilegal')
    expect(mockCreate).toHaveBeenCalledTimes(2)
  })
})
