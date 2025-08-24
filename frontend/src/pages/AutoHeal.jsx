import React, { useEffect, useState } from 'react'
import io from 'socket.io-client'
import { LineChart, Line, XAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts'
import { API_BASE, fetchAutohealEvents } from '../api'

const icons = { restart: '🔄', rollback: '🌀', escalation: '⚠' }

export default function AutoHeal({ socket: externalSocket, fetchEvents = fetchAutohealEvents }){
  const [events, setEvents] = useState([])

  useEffect(() => {
    (async () => {
      const ev = await fetchEvents()
      setEvents(ev)
      const s = externalSocket || io(API_BASE, { transports: ['websocket'] })
      s.on('autoheal:event', e => setEvents(prev => [e, ...prev]))
      if (!externalSocket) return () => s.close()
    })()
  }, [externalSocket, fetchEvents])

  const recent = events.filter(e => Date.now() - new Date(e.timestamp).getTime() < 86400000)
  const restarts = recent.filter(e => e.action === 'restart').length
  const rollbacks = recent.filter(e => e.action === 'rollback').length
  const escalations = recent.filter(e => e.action === 'escalation').length
  const hourly = {}
  recent.forEach(e => {
    const h = new Date(e.timestamp).getHours()
    hourly[h] = (hourly[h] || 0) + 1
  })
  const data = Object.keys(hourly).sort().map(h => ({ hour: h, count: hourly[h] }))

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Summary label="Total restarts" value={restarts} />
        <Summary label="Total rollbacks" value={rollbacks} />
        <Summary label="Escalations triggered" value={escalations} />
      </div>
      <div className="bg-slate-900 p-4 rounded-lg">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <XAxis dataKey="hour" />
            <Tooltip />
            <CartesianGrid strokeDasharray="3 3" />
            <Line type="monotone" dataKey="count" stroke="#0096FF" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-2">
        {events.map((e, i) => (
          <EventItem key={i} event={e} />
        ))}
      </div>
    </div>
  )
}

function Summary({ label, value }){
  return (
    <div className="card text-center">
      <div className="text-sm text-slate-400">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  )
}

function EventItem({ event }){
  const color = event.result === 'failure' ? 'text-red-400' : 'text-green-400'
  return (
    <div className={`flex items-center gap-2 ${color}`} title={event.message || ''}>
      <span>{icons[event.action] || 'ℹ️'}</span>
      <span className="text-xs text-slate-400">{new Date(event.timestamp).toLocaleTimeString()}</span>
      <span className="font-medium">{event.service}</span>
      <span>{event.action}</span>
      <span>{event.result}</span>
    </div>
  )
}
