const BASE = () => process.env.REPLIZ_API_URL || 'https://api.repliz.com/public'

function authHeader() {
  const user = process.env.REPLIZ_USERNAME
  const pass = process.env.REPLIZ_PASSWORD
  if (!user || !pass) {
    throw new Error('REPLIZ_USERNAME and REPLIZ_PASSWORD must be set in .env')
  }
  const token = Buffer.from(`${user}:${pass}`).toString('base64')
  return `Basic ${token}`
}

export async function replizFetch(path, options = {}) {
  const url = `${BASE()}${path.startsWith('/') ? path : `/${path}`}`
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: authHeader(),
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options.headers,
    },
  })
  const text = await res.text()
  let data
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = { raw: text }
  }
  if (!res.ok) {
    const err = new Error(data?.message || data?.error || `Repliz API ${res.status}`)
    err.status = res.status
    err.data = data
    throw err
  }
  return data
}

export function isReplizConfigured() {
  return Boolean(process.env.REPLIZ_USERNAME && process.env.REPLIZ_PASSWORD)
}
