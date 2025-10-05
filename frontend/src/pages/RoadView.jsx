import React, { useEffect, useState } from 'react'
import { fetchRoadviewStreams } from '../api'

const colors = ['var(--accent)', 'var(--accent-2)', 'var(--accent-3)']

export default function RoadView({ agents = [] }){
  const [streams, setStreams] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const list = await fetchRoadviewStreams()
        if (alive) setStreams(Array.isArray(list) ? list : [])
      } catch {
        if (alive) setStreams([])
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  return (
    <section className="col-span-8">
      <h1 className="text-xl font-semibold mb-4">RoadView</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading && (
          <div className="col-span-full card flex items-center justify-center h-40 text-slate-500">
            Loading streams…
          </div>
        )}
        {!loading && streams.length === 0 && (
          <div className="col-span-full card flex items-center justify-center h-40 text-slate-500">
            No active streams yet.
          </div>
        )}
        {streams.map((stream) => (
          <div key={stream.id || stream.name} className="card p-4 h-40 flex flex-col justify-between">
            <div>
              <div className="text-lg font-semibold">{stream.name || stream.id}</div>
              <div className="text-sm text-slate-400 mt-1">
                {stream.status || stream.description || 'Coming soon'}
              </div>
            </div>
            {stream.lastUpdate && (
              <div className="text-xs text-slate-500">Updated {new Date(stream.lastUpdate).toLocaleString()}</div>
            )}
          </div>
        ))}
      </div>
      {agents.length > 0 && (
        <div className="flex items-center gap-2 mt-6">
          {agents.map((agent, index) => (
            <div
              key={agent.id || agent.key || index}
              title={agent.name || agent.username || 'agent'}
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: colors[index % colors.length] }}
            />
          ))}
        </div>
      )}
    </section>
  )
}
