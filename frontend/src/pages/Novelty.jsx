import React, { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'

const agents = [
  { key: 'love', name: 'Love', color: '#FF4FD8' },
  { key: 'curiosity', name: 'Curiosity', color: '#0096FF' },
  { key: 'consent', name: 'Consent', color: '#FDBA2D' },
  { key: 'creativity', name: 'Creativity', color: '#FF4FD8' },
  { key: 'art', name: 'Art', color: '#0096FF' },
  { key: 'poetry', name: 'Poetry', color: '#FDBA2D' },
  { key: 'music', name: 'Music', color: '#FF4FD8' },
  { key: 'math', name: 'Math', color: '#0096FF' },
  { key: 'paradox', name: 'Paradox', color: '#FDBA2D' },
  { key: 'dream', name: 'Dream', color: '#FF4FD8' },
  { key: 'oracle', name: 'Oracle', color: '#0096FF' }
]

export default function Novelty(){
  const [data, setData] = useState({})

  useEffect(()=>{
    agents.forEach(a=>{
      fetch(`/prism/logs/${a.key}.log`).then(r=>r.text()).then(txt=>{
        const lines = txt.trim().split('\n').slice(-5)
        setData(d=>({...d, [a.key]: lines}))
      }).catch(()=>{})
    })
    const ws = new WebSocket(`ws://${window.location.host}/ws/novelty`)
    ws.onmessage = e => {
      try {
        const { agent, entry } = JSON.parse(e.data)
        setData(d=>({ ...d, [agent]: [entry, ...(d[agent]||[])] }))
      } catch(err) {}
    }
    return ()=>ws.close()
  }, [])

  function ping(agent){
    fetch(`/api/novelty/${agent}/ping`, { method: 'POST' }).catch(()=>{})
  }
  function save(agent){
    const content = data[agent]?.[0]
    if(content){
      fetch(`/api/novelty/${agent}/save`, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ content })
      }).catch(()=>{})
    }
  }

  return (
    <div className="min-h-screen p-4" style={{background:'linear-gradient(135deg,#FF4FD8,#0096FF,#FDBA2D)'}}>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Sparkles size={20}/> Novelty Dashboard</h1>
        <button className="badge" onClick={()=>fetch('/api/novelty/spawn_all',{method:'POST'}).catch(()=>{})}>Spawn All</button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {agents.map(a=>(
          <div key={a.key} className="bg-slate-900/60 rounded-lg p-4 hover:shadow-lg" style={{borderColor:a.color}}>
            <header className="flex items-center justify-between mb-2">
              <h2 className="font-semibold" style={{color:a.color}}>{a.name} Agent</h2>
              <div className="flex gap-2">
                <button className="badge" onClick={()=>ping(a.key)}>Ping</button>
                <button className="badge" onClick={()=>save(a.key)}>Save</button>
              </div>
            </header>
            <div className="text-sm space-y-1 h-32 overflow-y-auto">
              {(data[a.key] || ['No data']).map((line,i)=>(<div key={i}>{line}</div>))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

