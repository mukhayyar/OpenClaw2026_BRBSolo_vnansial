import { isReplizConfigured, replizFetch } from '../lib/repliz.js'

function notConfigured() {
  return {
    configured: false,
    error: 'Repliz belum dikonfigurasi. Isi REPLIZ_USERNAME dan REPLIZ_PASSWORD di .env',
  }
}

export async function replizListAccounts({ page = 1, limit = 20, type } = {}) {
  if (!isReplizConfigured()) return notConfigured()
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (type) params.set('type', type)
  const data = await replizFetch(`/account?${params}`)
  return { configured: true, ...data }
}

export async function replizListSchedules({ page = 1, limit = 20, status } = {}) {
  if (!isReplizConfigured()) return notConfigured()
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (status) params.set('status', status)
  const data = await replizFetch(`/schedule?${params}`)
  return { configured: true, ...data }
}

export async function replizListContent({ accountId, type, nextToken } = {}) {
  if (!isReplizConfigured()) return notConfigured()
  if (!accountId) return { error: 'accountId wajib untuk mengambil konten' }
  const params = new URLSearchParams({ accountId })
  if (type) params.set('type', type)
  if (nextToken) params.set('nextToken', nextToken)
  const data = await replizFetch(`/content?${params}`)
  return { configured: true, ...data }
}

/** Build payload for text/link literacy posts via Repliz schedule API */
function buildTextSchedulePayload({
  accountId,
  title,
  description,
  topic,
  scheduleAt,
  linkUrl,
}) {
  const siteUrl = process.env.VNANSIAL_PUBLIC_URL || 'https://vnansial.app'
  return {
    title,
    description,
    topic: topic || 'Literasi Keuangan',
    type: 'text',
    medias: [],
    meta: {
      title: title.slice(0, 120),
      description: description.slice(0, 500),
      url: linkUrl || siteUrl,
    },
    additionalInfo: {
      isAiGenerated: true,
      isDraft: false,
      collaborators: [],
      music: { id: '', artist: '', name: '', thumbnail: '' },
    },
    replies: [],
    accountId,
    scheduleAt: scheduleAt || new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  }
}

export async function replizScheduleLiteracyPost({
  accountId,
  title,
  caption,
  topic,
  scheduleAt,
  linkUrl,
}) {
  if (!isReplizConfigured()) return notConfigured()
  if (!accountId) return { error: 'accountId wajib — gunakan repliz_list_accounts dulu' }
  if (!title || !caption) return { error: 'title dan caption wajib' }

  const body = buildTextSchedulePayload({
    accountId,
    title,
    description: caption,
    topic,
    scheduleAt,
    linkUrl,
  })
  const data = await replizFetch('/schedule', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return {
    configured: true,
    success: true,
    message: 'Jadwal posting literasi keuangan berhasil dibuat di Repliz',
    schedule: data,
  }
}
