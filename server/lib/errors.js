/** Map OpenAI/SumoPod SDK errors to user-safe API responses (no secrets). */
export function formatAgentError(err) {
  const status = err?.status ?? err?.response?.status
  const code = err?.code ?? err?.error?.code
  const msg = String(err?.message || err?.error?.message || 'Unknown error')

  if (msg.includes('SUMOPOD_API_KEY')) {
    return {
      ok: false,
      error: 'SumoPod API key not configured',
      hint: 'Add SUMOPOD_API_KEY to your .env file',
      code: 'missing_api_key',
    }
  }

  if (status === 401 || msg.toLowerCase().includes('invalid api key')) {
    return {
      ok: false,
      error: 'SumoPod authentication failed',
      hint: 'Check SUMOPOD_API_KEY in .env',
      code: 'auth_failed',
    }
  }

  if (status === 429 || msg.toLowerCase().includes('rate limit')) {
    return {
      ok: false,
      error: 'SumoPod rate limit exceeded',
      hint: 'Wait a moment and retry',
      code: 'rate_limit',
    }
  }

  const lower = msg.toLowerCase()
  if (
    status === 404 ||
    (lower.includes('model') &&
      (lower.includes('not found') || lower.includes('does not exist')))
  ) {
    return {
      ok: false,
      error: 'Model not available on SumoPod',
      hint: 'Set SUMOPOD_MODEL=qwen3.6-flash in .env (or a model your account supports)',
      code: 'invalid_model',
    }
  }

  return {
    ok: false,
    error: 'SumoPod request failed',
    hint: msg.slice(0, 200),
    code: code || 'upstream_error',
    status,
  }
}
