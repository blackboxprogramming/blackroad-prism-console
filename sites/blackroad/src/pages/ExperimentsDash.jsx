import { useEffect, useMemo, useState } from 'react'

function useJson(url, fallback){ const [d,setD]=useState(fallback); useEffect(()=>{ fetch(url,{cache:'no-cache'}).then(r=>r.json()).then(setD).catch(()=>setD(fallback)) },[url]); return d }

export default function ExperimentsDash(){
  const data = useJson('/experiments.json', { experiments: [] })
  const [sel,setSel]=useState('')
  const [active,setActive]=useState('on')
  const [a,setA]=useState(0.5)
  const [b,setB]=useState(0.5)
  useEffect(()=>{ if(data.experiments?.length && !sel) setSel(data.experiments[0].id) },[data,sel])

  const cmd = useMemo(()=>{
    if(!sel) return ''
    return `/exp set ${sel} active ${active} weights A=${a} B=${b}`
  },[sel,active,a,b])

  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-3">Experiments Dashboard</h2>
      <p className="text-sm opacity-80">This page _previews_ experiments from <code>/experiments.json</code> and prepares ChatOps commands to flip them live via a commit.</p>

      <section className="p-3 rounded-lg bg-white/5 border border-white/10 mt-3">
        <h3 className="font-semibold mb-2">Current Experiments</h3>
        <ul className="text-sm grid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:12}}>
          {(data.experiments||[]).map((e,i)=>(
            <li key={i} className="p-2 rounded bg-black/20">
              <div className="flex items-center justify-between">
                <b>{e.id}</b>
                <span className={`text-xs px-2 py-0.5 rounded ${e.active?'bg-green-500/30':'bg-gray-500/30'}`}>{e.active?'active':'off'}</span>
              </div>
              <div className="mt-1 text-xs opacity-80">{e.desc||''}</div>
              <div className="mt-1 text-xs">A:{e.weights?.A ?? 0.5} • B:{e.weights?.B ?? 0.5}</div>
            </li>
          ))}
        </ul>
      </section>

      <section className="p-3 rounded-lg bg-white/5 border border-white/10 mt-4">
        <h3 className="font-semibold mb-2">Flip Experiment via ChatOps</h3>
        {data.experiments?.length ? (
          <>
            <div className="grid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:12}}>
              <div>
                <label className="text-sm">Experiment</label>
                <select className="w-full text-black" value={sel} onChange={e=>setSel(e.target.value)}>
                  {data.experiments.map((e)=><option key={e.id} value={e.id}>{e.id}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm">Active</label>
                <select className="w-full text-black" value={active} onChange={e=>setActive(e.target.value)}>
                  <option value="on">on</option><option value="off">off</option>
                </select>
              </div>
              <div>
                <label className="text-sm">Weight A</label>
                <input type="number" step="0.05" className="w-full text-black" value={a} onChange={e=>setA(parseFloat(e.target.value)||0)} />
              </div>
              <div>
                <label className="text-sm">Weight B</label>
                <input type="number" step="0.05" className="w-full text-black" value={b} onChange={e=>setB(parseFloat(e.target.value)||0)} />
              </div>
            </div>
            <div className="mt-3">
              <label className="block text-sm">Comment this on any PR/Issue:</label>
              <pre className="p-2 rounded bg-black/40 text-xs overflow-auto">{cmd}</pre>
            </div>
          </>
        ) : <p>No experiments found.</p>}
      </section>
    </div>
  )
}
