export interface LogItem {
  ts: string
  level: 'error'|'warn'|'info'
  msg: string
  route?: string
  ua?: string
  ref?: string
  meta?: Record<string, unknown>
}

/* NEW: conversion event */
export interface ConvItem {
  ts: string
  id: string          // conversion name (e.g., "signup_click")
  value?: number      // optional numeric value (e.g., revenue)
  route?: string
  uid?: string        // optional user id/session hash
  meta?: Record<string, unknown>
}

function jsonResponse(obj: unknown, status = 200, origin?: string) {
  return new Response(JSON.stringify(obj, null, 2), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'access-control-allow-origin': origin || '*',
      'access-control-allow-headers': 'content-type,authorization,x-api-key',
      'access-control-allow-methods': 'GET,POST,OPTIONS',
    }
  })
}

async function pushLog(env: Env, item: LogItem) {
  const key = `log:${item.ts}:${Math.random().toString(36).slice(2,8)}`
  await env.ERROR_LOGS.put(key, JSON.stringify(item), { expirationTtl: 60*60*24*14 }) // 14d
  await env.ERROR_LOGS.put('latest', key)
}

/* NEW: store conversion as a raw item (conv:...) for last 30d */
async function pushConv(env: Env, item: ConvItem) {
  const key = `conv:${item.ts}:${item.id}:${Math.random().toString(36).slice(2,8)}`
  await env.ERROR_LOGS.put(key, JSON.stringify(item), { expirationTtl: 60*60*24*30 }) // 30d
}

/* NEW: list recent conversions (optionally since=? ISO string) and aggregate by id/day */
async function listConvs(env: Env, limit=1000, sinceISO?: string) {
  // KV listing is lexicographic: we fetch all 'conv:' keys (bounded by 1000/req)
  const list = await env.ERROR_LOGS.list({ prefix: 'conv:' })
  let keys = list.keys.sort((a,b)=> (a.name<b.name?1:-1)) // newest first
  if (limit) keys = keys.slice(0, limit)
  const items: ConvItem[] = []
  for (const k of keys) {
    const raw = await env.ERROR_LOGS.get(k.name)
    if (!raw) continue
    const item = JSON.parse(raw) as ConvItem
    if (sinceISO && new Date(item.ts) < new Date(sinceISO)) continue
    items.push(item)
  }
  // aggregate by day + id
  const byId: Record<string, { total: number, value: number, series: Record<string, {count:number, value:number}> }> = {}
  for (const it of items) {
    const day = it.ts.slice(0,10) // YYYY-MM-DD
    const rec = (byId[it.id] ||= { total:0, value:0, series:{} })
    rec.total += 1
    rec.value += (typeof it.value === 'number' ? it.value : 0)
    const cell = (rec.series[day] ||= { count:0, value:0 })
    cell.count += 1
    cell.value += (typeof it.value === 'number' ? it.value : 0)
  }
  // build timeseries rows (aligned days) for top 5 ids
  const ids = Object.keys(byId).sort((a,b)=> byId[b].total - byId[a].total).slice(0,5)
  const allDays = new Set<string>()
  for (const id of ids) Object.keys(byId[id].series).forEach(d => allDays.add(d))
  const days = [...allDays].sort()
  const rows = days.map(d => {
    const r: any = { day: d }
    for (const id of ids) r[id] = byId[id].series[d]?.count || 0
    return r
  })
  return { ids, days, rows, totals: ids.map(id => ({ id, total: byId[id].total, value: byId[id].value })) }
}

type Env = {
  ERROR_LOGS: KVNamespace
  CORS_ORIGIN?: string
  API_KEY?: string
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url)
    const origin = env.CORS_ORIGIN || '*'
    if (req.method === 'OPTIONS') return jsonResponse({}, 204, origin)

    // GET /logs?limit=200
    if (url.pathname === '/logs' && req.method === 'GET') {
      const lim = Math.min(parseInt(url.searchParams.get('limit') || '100',10), 1000)
      const items = await (async()=>{
        const list = await env.ERROR_LOGS.list({ prefix: 'log:' })
        const keys = list.keys.sort((a,b)=> (a.name<b.name?1:-1)).slice(0, lim)
        const arr: LogItem[] = []
        for (const k of keys) { const raw = await env.ERROR_LOGS.get(k.name); if (raw) arr.push(JSON.parse(raw)) }
        return arr
      })()
      return jsonResponse({ ts: new Date().toISOString(), count: items.length, items }, 200, origin)
    }

    // POST /log (write)
    if (url.pathname === '/log' && req.method === 'POST') {
      if (env.API_KEY) {
        const key = req.headers.get('x-api-key')
        if (key !== env.API_KEY) return jsonResponse({ error: 'unauthorized' }, 401, origin)
      }
      const item = await req.json().catch(()=>null) as LogItem|null
      if (!item || !item.msg) return jsonResponse({ error:'bad payload' }, 400, origin)
      if (!item.ts) item.ts = new Date().toISOString()
      await pushLog(env, item)
      return jsonResponse({ ok: true }, 200, origin)
    }

    /* NEW: POST /convert (record conversion) */
    if (url.pathname === '/convert' && req.method === 'POST') {
      if (env.API_KEY) {
        const key = req.headers.get('x-api-key')
        if (key !== env.API_KEY) return jsonResponse({ error: 'unauthorized' }, 401, origin)
      }
      const item = await req.json().catch(()=>null) as ConvItem|null
      if (!item || !item.id) return jsonResponse({ error:'bad payload' }, 400, origin)
      if (!item.ts) item.ts = new Date().toISOString()
      await pushConv(env, item)
      return jsonResponse({ ok: true }, 200, origin)
    }

    /* NEW: GET /conversions?since=YYYY-MM-DD&limit=1000 */
    if (url.pathname === '/conversions' && req.method === 'GET') {
      const lim = Math.min(parseInt(url.searchParams.get('limit') || '1000',10), 2000)
      const since = url.searchParams.get('since') || undefined
      const data = await listConvs(env, lim, since)
      return jsonResponse({ ts: new Date().toISOString(), ...data }, 200, origin)
    }

    return jsonResponse({ ok: true, service: 'blackroad-error-logger' }, 200, origin)
  }
}
