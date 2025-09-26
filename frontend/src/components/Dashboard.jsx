import React, { useEffect, useState } from 'react'
import { fetchDashboardSystem, fetchDashboardFeed } from '../api'
import { fetchAllAgents } from '../agents'

function MetricCard({ label, value }){
  return (
    <div className="card p-4 text-center" style={{ borderColor: 'var(--accent)' }}>
      <div className="text-sm text-slate-400">{label}</div>
      <div className="text-2xl font-bold">{value}%</div>
    </div>
  )
}

export default function Dashboard(){
  const [metrics, setMetrics] = useState({ cpu:0, gpu:0, memory:0, network:0 })
  const [feed, setFeed] = useState([])
  const [agents, setAgents] = useState([])

  useEffect(()=>{
    (async ()=>{
      const m = await fetchDashboardSystem()
      setMetrics(m)
      const f = await fetchDashboardFeed()
      setFeed(f)
      const ag = await fetchAllAgents()
      setAgents(ag)
    })()
  }, [])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="CPU" value={metrics.cpu} />
        <MetricCard label="GPU" value={metrics.gpu} />
        <MetricCard label="Memory" value={metrics.memory} />
        <MetricCard label="Network" value={metrics.network} />
      </div>

      <section>
        <h2 className="font-semibold mb-2">Activity Feed</h2>
        <ul className="space-y-2 max-h-64 overflow-auto">
          {feed.map(e => (
            <li key={e.id} className="card p-2 text-sm">{e.text || e.type}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="font-semibold mb-2">Agents</h2>
        <div className="grid grid-cols-3 gap-4">
          {agents.map(a => (
            <div key={a.id} className="card p-4">
              <div className="font-medium">{a.name}</div>
              <div className="text-xs text-slate-400">{a.status} · {a.location}</div>
              <div className="text-xs text-slate-400">{a.status}</div>
              <div className="text-xs text-slate-500">Location: {a.location}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
