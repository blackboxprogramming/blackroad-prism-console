import React, { useEffect, useState } from 'react'
import { fetchGuardianStatus, fetchGuardianAlerts, resolveGuardianAlert } from './api'

export default function Guardian(){
  const [status, setStatus] = useState({ secure: true, mfa: true, encryption: true, lastScan: '' })
  const [alerts, setAlerts] = useState([])

  useEffect(()=>{ (async ()=>{
    const s = await fetchGuardianStatus()
    setStatus(s)
    const a = await fetchGuardianAlerts()
    setAlerts(a)
  })() }, [])

  async function updateAlert(id, newStatus){
    const alert = await resolveGuardianAlert(id, newStatus)
    setAlerts(prev=>prev.map(a=>a.id===id? alert : a))
  }

  return (
    <section className="col-span-8 space-y-6">
      <header className="text-2xl font-semibold">Guardian</header>
      <div className="flex items-center gap-3">
        <span>System Status:</span>
        <span className={status.secure? 'text-green-400':'text-red-500'}>
          {status.secure? 'Secure':'Alert'}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="text-slate-400 text-sm">MFA Status</div>
          <div className="text-xl font-semibold" style={{color:'var(--accent-2)'}}>{status.mfa? 'Enabled':'Disabled'}</div>
        </div>
        <div className="card p-4">
          <div className="text-slate-400 text-sm">Encryption</div>
          <div className="text-xl font-semibold" style={{color:'var(--accent-3)'}}>{status.encryption? 'Enabled':'Disabled'}</div>
        </div>
        <div className="card p-4">
          <div className="text-slate-400 text-sm">Last Scan</div>
          <div className="text-xl font-semibold" style={{color:'var(--accent)'}}>{status.lastScan}</div>
        </div>
      </div>

      <div>
        <h2 className="text-xl mb-2">Active Alerts</h2>
        <div className="space-y-2">
          {alerts.map(a=>(
            <div key={a.id} className="card p-3 flex items-center justify-between">
              <div>
                <div className="font-semibold">{a.type}</div>
                <div className="text-xs text-slate-400">{a.severity} · {a.time}</div>
              </div>
              <div className="space-x-2">
                {a.status !== 'acknowledged' && (
                  <button className="badge" style={{backgroundColor:'var(--accent-3)'}} onClick={()=>updateAlert(a.id, 'acknowledged')}>Acknowledge</button>
                )}
                {a.status !== 'resolved' && (
                  <button className="badge" style={{backgroundColor:'var(--accent-2)'}} onClick={()=>updateAlert(a.id, 'resolved')}>Resolve</button>
                )}
              </div>
            </div>
          ))}
          {!alerts.length && <div className="text-slate-400">No active alerts</div>}
        </div>
      </div>
    </section>
  )
}
