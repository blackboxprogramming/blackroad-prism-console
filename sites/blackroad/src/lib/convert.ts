import { getAssignments } from './ab.ts'

function base(){ return import.meta.env.VITE_ANALYTICS_BASE || '' }
export function recordConversion(id: string, value?: number, meta: Record<string,unknown> = {}){
  const endpoint = base() ? `${base()}/convert` : (import.meta.env.VITE_LOG_WRITE_URL ? import.meta.env.VITE_LOG_WRITE_URL.replace(/\/log$/, '/convert') : '')
  if (!endpoint) return
  const ab = safeAB()
  const payload = {
    ts: new Date().toISOString(),
    id, value,
    route: location.pathname,
    uid: getAnonId(),
    meta: { ...meta, ab }
  }
  try {
    navigator.sendBeacon?.(endpoint, new Blob([JSON.stringify(payload)], { type: 'application/json' }))
  } catch {
    fetch(endpoint, { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify(payload) }).catch(()=>{})
  }
}
function getAnonId(){
  const k='br_uid'
  const m=document.cookie.match(new RegExp(`${k}=([^;]+)`))
  if (m) return decodeURIComponent(m[1])
  const v = Math.random().toString(36).slice(2) + Date.now().toString(36)
  document.cookie = `${k}=${encodeURIComponent(v)}; path=/; max-age=${60*60*24*365}`
  return v
}
function safeAB(){
  try { return getAssignments() } catch { return {} }
}
