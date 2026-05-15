/** Map SumoPod / OpenAI-compatible API errors to user-safe messages (no secrets). */
export function formatSumoPodError(err) {
  const status = err?.status ?? err?.response?.status
  const code = err?.code ?? err?.error?.code
  const msg = String(err?.message || err?.error?.message || 'Unknown error')

  if (status === 401 || /invalid.*api.*key|unauthorized/i.test(msg)) {
    return {
      error: 'SumoPod authentication failed',
      hint: 'Check SUMOPOD_API_KEY in .env',
      code: 'auth_failed',
    }
  }
  if (status === 429 || /rate.?limit/i.test(msg)) {
    return {
      error: 'SumoPod rate limit exceeded',
      hint: 'Wait a moment and retry, or upgrade your SumoPod quota',
      code: 'rate_limit',
    }
  }
  if (status === 404 || /model.*not found|does not exist|invalid model/i.test(msg)) {
    return {
      error: 'Model not available on SumoPod',
      hint: 'Set SUMOPOD_MODEL=qwen3.6-flash in .env or verify model id in SumoPod dashboard',
      code: 'invalid_model',
    }
  }
  if (/timeout|ETIMEDOUT|ECONNRESET/i.test(msg)) {
    return {
      error: 'SumoPod request timed out',
      hint: 'Retry or check https://ai.sumopod.com status',
      code: 'timeout',
    }
  }

  return {
    error: msg.slice(0, 280),
    hint: 'See server logs; verify SUMOPOD_BASE_URL and SUMOPOD_MODEL',
    code: code || 'api_error',
    status,
  }
}
