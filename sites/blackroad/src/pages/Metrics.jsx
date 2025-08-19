import { useEffect, useMemo, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid, BarChart, Bar } from 'recharts'

function useJson(url, fallback){ const [d,setD]=useState(fallback); useEffect(()=>{ if(!url){ setD(fallback); return } fetch(url,{cache:'no-cache'}).then(r=>r.json()).then(setD).catch(()=>setD(fallback)) },[url]); return d }
function fmtTs(s){ try{ return new Date(s).toLocaleString() }catch{ return s } }
function msToMin(ms){ return (ms/60000).toFixed(2) }

function getAnalyticsBase(){
  const direct = import.meta.env.VITE_ANALYTICS_BASE
  if (direct) return direct
  const logs = import.meta.env.VITE_LOGS_URL
  if (logs) return logs.replace(/\/logs$/, '')
  return ''
}

export default function Metrics(){
  const ci = useJson('/metrics/ci.json', { runs: [] })
  const lh = useJson('/metrics/lh.json', { history: [] })
  const convBase = getAnalyticsBase()
  const funnels = useJson('/funnels.json', { funnels: [] })
function useJson(url, fallback){ const [d,setD]=useState(fallback); useEffect(()=>{ fetch(url,{cache:'no-cache'}).then(r=>r.json()).then(setD).catch(()=>setD(fallback)) },[url]); return d }

function fmtTs(s){ try{ return new Date(s).toLocaleString() }catch{ return s } }
function msToMin(ms){ return (ms/60000).toFixed(2) }

export default function Metrics(){
  const ci = useJson('/metrics/ci.json', { runs: [] })
  const lh = useJson('/metrics/lh.json', { history: [] })

  const byWF = useMemo(()=> {
    const m = {}
    for (const r of ci.runs || []) { (m[r.wf] ||= []).push(r) }
    for (const k of Object.keys(m)) m[k] = m[k].slice(-20)
    return m
  }, [ci])

  const lhSeries = useMemo(()=> (lh.history||[]).slice(0,30).reverse().map(x=>({
    ts: fmtTs(x.ts), perf: +(x.perf*100).toFixed(1), a11y:+(x.a11y*100).toFixed(1),
    bp:+(x.bp*100).toFixed(1), seo:+(x.seo*100).toFixed(1),
    LCP:+(x.LCP/1000).toFixed(2), FCP:+(x.FCP/1000).toFixed(2), CLS:+(+x.CLS).toFixed(3), TBT:+(x.TBT/1000).toFixed(2)
  })), [lh])

  // Pull full raw conversions for variant lift and funnels (best-effort)
  const rawConv = useRaw(convBase)

  const expIds = useMemo(()=>{
    const s = new Set()
    for (const c of rawConv) {
      const ab = c.meta?.ab || {}
      Object.keys(ab).forEach(eid=>s.add(eid))
    }
    return Array.from(s)
  }, [rawConv])

  const [chosenExp,setChosenExp]=useState('')
  useEffect(()=>{ if(!chosenExp && expIds.length) setChosenExp(expIds[0]) },[expIds,chosenExp])

  const lift = useMemo(()=> variantLift(rawConv, chosenExp), [rawConv, chosenExp])
  const funnelStats = useMemo(()=> computeFunnels(rawConv, funnels.funnels||[]), [rawConv, funnels])

  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-3">Metrics & Observability</h2>

      {/* Lighthouse */}
      <section className="p-3 rounded-lg bg-white/5 border border-white/10 mb-4">
        <h3 className="font-semibold mb-2">Lighthouse (averaged across key pages)</h3>
        <div className="grid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))', gap:16}}>
          <Chart title="Scores (%)" data={lhSeries} lines={[['perf','Performance'],['a11y','Accessibility'],['bp','Best Practices'],['seo','SEO']]} />
          <Chart title="Core timings (s)" data={lhSeries} lines={[['FCP','FCP'],['LCP','LCP'],['TBT','TBT (s)']]} />
          <Chart title="Layout shift (CLS)" data={lhSeries} lines={[['CLS','CLS']]} />
        </div>
      </section>

      {/* CI */}
      <section className="p-3 rounded-lg bg-white/5 border border-white/10">
        <h3 className="font-semibold mb-2">CI History (last 20 per workflow)</h3>
        <div className="grid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(360px,1fr))', gap:16}}>
          {Object.entries(byWF).map(([wf,runs])=>(
            <div key={wf} className="p-3 rounded bg-black/20">
              <h4 className="font-semibold mb-2">{wf}</h4>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={runs.map(r=>({ ts: fmtTs(r.updated_at||r.started_at), min: +msToMin(r.duration_ms), ok: r.conclusion==='success' ? 1 : 0 }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="ts" hide/>
                  <YAxis yAxisId="left" label={{ value: 'min', angle:-90, position:'insideLeft' }}/>
                  <YAxis yAxisId="right" orientation="right" domain={[0,1]} hide/>
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="min" name="duration (min)" fill="currentColor" />
                </BarChart>
              </ResponsiveContainer>
              <ul className="text-xs mt-2 space-y-1">
                {runs.slice(-5).reverse().map((r,i)=>(
                  <li key={i}>
                    <code>{(r.sha||'').slice(0,7)}</code> — {r.conclusion || r.status} — {msToMin(r.duration_ms)} min — <span className="opacity-70">{fmtTs(r.updated_at||r.started_at)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Variant Lift */}
      <section className="p-3 rounded-lg bg-white/5 border border-white/10 mt-4">
        <h3 className="font-semibold mb-2">Per-Variant Conversion Lift</h3>
        {expIds.length ? (
          <>
            <div className="mb-2 text-sm">
              <label>Select experiment: </label>
              <select className="text-black" value={chosenExp} onChange={e=>setChosenExp(e.target.value)}>
                {expIds.map(id=><option key={id}>{id}</option>)}
              </select>
            </div>
            <div className="grid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:12}}>
              {Object.entries(lift).map(([convId,stats])=>(
                <div key={convId} className="p-2 rounded bg-black/20 text-sm">
                  <b>{convId}</b>
                  <div className="mt-1">A: <code>{stats.A.count}</code> ({pct(stats.A.rate)}) • B: <code>{stats.B.count}</code> ({pct(stats.B.rate)})</div>
                  <div className="mt-1">Lift (B vs A): <b>{pct(stats.lift)}</b></div>
                </div>
              ))}
            </div>
            <p className="text-xs opacity-70 mt-2">Rates estimate unique-uid conversion probability per arm (naïve). Treat as directional unless normalized by traffic.</p>
          </>
        ) : <p className="text-sm opacity-70">No experiment assignments found in conversion meta. Ensure the client includes AB (it does by default now).</p>}
      </section>

      {/* Funnels */}
      <section className="p-3 rounded-lg bg-white/5 border border-white/10 mt-4">
        <h3 className="font-semibold mb-2">Funnels (last 30 days)</h3>
        {funnelStats.length ? (
          <div className="grid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:12}}>
            {funnelStats.map(f=>(
              <div key={f.name} className="p-2 rounded bg-black/20 text-sm">
                <b>{f.name}</b><div className="text-xs opacity-70">{f.description||''}</div>
                <ol className="mt-2 space-y-1">
                  {f.steps.map((s,i)=>(
                    <li key={i}>
                      <span className="opacity-80">{i+1}. {s.id}</span> — <code>{s.count}</code> users
                      {i>0 && <span className="opacity-70"> • step-rate {pct(s.rate)} • cum {pct(s.cumRate)}</span>}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        ) : <p className="text-sm opacity-70">No funnel data yet.</p>}
        <p className="text-xs opacity-60 mt-2">Add/update funnels via ChatOps: <code>/funnel set "Signup" window 14 steps cta_click,portal_open,signup_success</code></p>
      </section>
    </div>
  )
}

function Chart({title,data,lines}){
  return (
    <div className="p-3 rounded bg-black/20">
      <h4 className="font-semibold mb-2">{title}</h4>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="ts" hide/>
          <YAxis />
          <Tooltip />
          <Legend />
          {lines.map(([k,label])=> <Line key={k} type="monotone" dataKey={k} name={label} dot={false} />)}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function useRaw(base){
  const [raw,setRaw]=useState([])
  useEffect(()=>{
    if(!base){ setRaw([]); return }
    fetch(`${base}/conversions?limit=2000`, {cache:'no-cache'}).then(r=>r.json()).then(j=>{
      setRaw((j.items||j.raw||[]))
    }).catch(()=> setRaw([]))
  }, [base])
  return raw
}

function pct(x){ if(!isFinite(x)) return '—'; return (x*100).toFixed(1)+'%' }

function variantLift(items, expId){
  if(!expId) return {}
  const byConv = {}
  const seen = {A:new Set(), B:new Set()}
  for(const it of items){
    const uid = it.uid || it.meta?.uid
    if(!uid) continue
    const arm = it.meta?.ab?.[expId]
    if(arm!=='A' && arm!=='B') continue
    const id = it.id
    byConv[id] ||= { A: new Map(), B: new Map() }
    const bucket = byConv[id][arm]
    bucket.set(uid, (bucket.get(uid)||0) + 1)
    seen[arm].add(uid)
  }
  const out={}
  for(const [cid, rec] of Object.entries(byConv)){
    const A = rec.A.size, B = rec.B.size
    const baseA = seen.A.size || 1
    const baseB = seen.B.size || 1
    const rateA = A/baseA, rateB = B/baseB
    out[cid] = { A: {count:A, rate: rateA}, B: {count:B, rate: rateB}, lift: (rateB - rateA) }
  }
  return out
}

function computeFunnels(items, funnels){
  if(!Array.isArray(items) || !items.length) return []
  const byUid = new Map()
  for(const it of items){
    const uid = it.uid || it.meta?.uid; if(!uid) continue
    const arr = byUid.get(uid) || []
    arr.push(it)
    byUid.set(uid, arr)
  }
  const out=[]
  for(const f of (funnels||[])){
    const windowMs = (f.windowDays||14) * 86400000
    const steps = f.steps||[]
    const stepCounts = Array(steps.length).fill(0)
    const users = new Set()
    for(const [uid, arr] of byUid.entries()){
      const sorted = arr.slice().sort((a,b)=> new Date(a.ts).getTime()-new Date(b.ts).getTime())
      let startIdx = sorted.findIndex(x=>x.id===steps[0]?.id)
      if(startIdx<0) continue
      users.add(uid)
      let startTime = new Date(sorted[startIdx].ts).getTime()
      stepCounts[0]++
      for(let step=1; step<steps.length; step++){
        const next = sorted.find(x=> x.id===steps[step].id && new Date(x.ts).getTime() - startTime <= windowMs)
        if(next){ stepCounts[step]++; startTime = new Date(next.ts).getTime() }
        else break
      }
    }
    const totalUsers = users.size || 1
    const formatted = steps.map((s,i)=>({
      id: s.id,
      count: stepCounts[i],
      rate: i>0 ? stepCounts[i]/Math.max(1,stepCounts[i-1]) : 1,
      cumRate: stepCounts[i]/totalUsers
    }))
    out.push({ name:f.name, description:f.description, steps: formatted })
  }
  return out
}
