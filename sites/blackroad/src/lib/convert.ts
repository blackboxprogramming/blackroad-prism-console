import { getAssignments } from './ab.ts'

// Client helper to record conversions to your worker.
// Set VITE_ANALYTICS_BASE like "https://<worker-subdomain>.workers.dev"
function base(): string {
  return import.meta.env.VITE_ANALYTICS_BASE || ''
}

function getAnonId(): string {
  const key = 'br_uid'
  const match = document.cookie.match(new RegExp(`${key}=([^;]+)`))
  if (match) return decodeURIComponent(match[1])

  const value = Math.random().toString(36).slice(2) + Date.now().toString(36)
  document.cookie = `${key}=${encodeURIComponent(value)}; path=/; max-age=${60 * 60 * 24 * 365}`
  return value
}

function safeAB(): Record<string, unknown> {
  try {
    return getAssignments()
  } catch {
    return {}
  }
}

export function recordConversion(id: string, value?: number, meta: Record<string, unknown> = {}): void {
  const endpoint = base()
    ? `${base()}/convert`
    : import.meta.env.VITE_LOG_WRITE_URL
    ? import.meta.env.VITE_LOG_WRITE_URL.replace(/\/log$/, '/convert')
    : ''

  if (!endpoint) return

  const payload = {
    ts: new Date().toISOString(),
    id,
    value,
    route: location.pathname,
    uid: getAnonId(),
    meta: {
      ...meta,
      ab: safeAB(),
    },
  }

  try {
    navigator.sendBeacon?.(endpoint, new Blob([JSON.stringify(payload)], { type: 'application/json' }))
  } catch {
    fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {})
  }
}
