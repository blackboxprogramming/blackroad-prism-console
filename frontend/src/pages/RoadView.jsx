import React, { useEffect, useState } from 'react'
import AgentStack from '../components/AgentStack.jsx'
import { fetchRoadviewStreams } from '../api'

const colors = ['var(--accent)', 'var(--accent-2)', 'var(--accent-3)']

export default function RoadView({ agents, stream, setStream, system, wallet, contradictions, notes, setNotes }){
  const [streams, setStreams] = useState([])
  useEffect(()=>{ (async()=>{ try{ const s = await fetchRoadviewStreams(); setStreams(s) } catch{} })() }, [])
  return (
    <>
      <section className="col-span-8">
        <h1 className="text-xl font-semibold mb-4">RoadView</h1>
        <div className="grid grid-cols-2 gap-4">
          {streams.map(s => (
            <div key={s.id} className="card flex items-center justify-center h-40 text-slate-400">Coming Soon</div>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-4">
          {agents.map((a,i)=>(
            <div key={a.id||i} title={a.name||a.username} className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[i%colors.length] }}></div>
          ))}
        </div>
      </section>
      <section className="col-span-4 flex flex-col gap-4">
        <AgentStack stream={stream} setStream={setStream} system={system} wallet={wallet} contradictions={contradictions} notes={notes} setNotes={setNotes} />
      </section>
    </>
  )
}
