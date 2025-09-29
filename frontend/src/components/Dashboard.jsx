import React, { useEffect, useRef, useState } from 'react'
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
  const [transcription, setTranscription] = useState('')
  const [transcribing, setTranscribing] = useState(false)
  const fileInputRef = useRef(null)

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

  async function handleTranscribe(event){
    event.preventDefault()
    const file = fileInputRef.current?.files?.[0]
    if(!file){
      setTranscription('No file selected')
      return
    }

    const formData = new FormData()
    formData.append('file', file)
    setTranscribing(true)
    setTranscription('Processing…')

    try {
      const response = await fetch('/transcribe', { method: 'POST', body: formData })
      const json = await response.json()
      setTranscription(json.text || JSON.stringify(json, null, 2))
    } catch (error) {
      setTranscription(`[error] ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setTranscribing(false)
    }
  }

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

      <section className="card p-4 space-y-3">
        <div className="title font-semibold">Whisper Transcription</div>
        <form className="space-y-3" onSubmit={handleTranscribe}>
          <input ref={fileInputRef} type="file" accept="audio/*" className="input w-full" />
          <button className="btn" type="submit" disabled={transcribing}>
            {transcribing ? 'Processing…' : 'Transcribe'}
          </button>
        </form>
        <pre
          aria-live="polite"
          style={{
            background: '#000',
            color: '#0f0',
            padding: '1em',
            height: '220px',
            overflow: 'auto',
            borderRadius: '6px',
          }}
        >
          {transcription}
        </pre>
      </section>
    </div>
  )
}
