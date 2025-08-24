import React, { useEffect, useState } from 'react'
import { fetchOrchestratorAgents, controlAgent } from './api'

export default function Orchestrator({ socket }){
  const [agents, setAgents] = useState([])

  useEffect(()=>{
    (async()=>{
      const list = await fetchOrchestratorAgents()
      setAgents(list)
    })()
  }, [])

  useEffect(()=>{
    if (!socket) return
    const handler = (metrics)=>{
      setAgents(prev => prev.map(a => {
        const m = metrics.find(x => x.id === a.id)
        return m ? { ...a, ...m } : a
      }))
    }
    socket.on('orchestrator:metrics', handler)
    return ()=> socket.off('orchestrator:metrics', handler)
  }, [socket])

  async function ctl(id, action){
    await controlAgent(id, action)
    setAgents(prev => prev.map(a => a.id===id ? { ...a, status: action==='start' || action==='restart' ? 'running' : 'stopped' } : a))
  }

  function startAll(){ agents.forEach(a => ctl(a.id, 'start')) }
  function stopAll(){ agents.forEach(a => ctl(a.id, 'stop')) }

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button className="badge" onClick={startAll}>Start All</button>
        <button className="badge" onClick={stopAll}>Stop All</button>
      </div>
      <table className="w-full text-sm">
        <thead className="text-left">
          <tr className="border-b border-slate-700">
            <th className="py-2">Name</th>
            <th>Status</th>
            <th>CPU</th>
            <th>Memory</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {agents.map(a => (
            <tr key={a.id} className="border-b border-slate-800 last:border-none">
              <td className="py-2">{a.name}</td>
              <td>{a.status}</td>
              <td>{a.cpu}%</td>
              <td>{a.memory}%</td>
              <td className="flex gap-1">
                <button className="badge" onClick={()=>ctl(a.id,'start')}>Start</button>
                <button className="badge" onClick={()=>ctl(a.id,'stop')}>Stop</button>
                <button className="badge" onClick={()=>ctl(a.id,'restart')}>Restart</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
