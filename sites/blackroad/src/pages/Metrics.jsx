import { useEffect, useMemo, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid, BarChart, Bar } from 'recharts'

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

  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-3">Metrics & Observability</h2>

      <section className="p-3 rounded-lg bg-white/5 border border-white/10 mb-4">
        <h3 className="font-semibold mb-2">Lighthouse (averaged across key pages)</h3>
        <div className="grid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))', gap:16}}>
          <Chart title="Scores (%)" data={lhSeries} lines={[['perf','Performance'],['a11y','Accessibility'],['bp','Best Practices'],['seo','SEO']]} />
          <Chart title="Core timings (s)" data={lhSeries} lines={[['FCP','FCP'],['LCP','LCP'],['TBT','TBT (s)']]} />
          <Chart title="Layout shift (CLS)" data={lhSeries} lines={[['CLS','CLS']]} />
        </div>
      </section>

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
