import React, { useEffect, useState } from 'react'
import { API_BASE } from './api.js'

const plans = [
  { key: 'free', name: 'Free', monthly: 0, annual: 0 },
  { key: 'builder', name: 'Builder', monthly: 29, annual: 290 },
  { key: 'guardian', name: 'Guardian', monthly: 99, annual: 990 }
]

export default function Subscribe(){
  const [cycle, setCycle] = useState('monthly')
  const [status, setStatus] = useState({})
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({ email: '', name: '', company: '', address: '', notes: '' })
  const [confirmed, setConfirmed] = useState(false)

  useEffect(()=>{
    fetch(`${API_BASE}/api/connectors/status`).then(r=>r.json()).then(setStatus)
  },[])

  function startCheckout(plan){
    if(status.stripe){
      fetch(`${API_BASE}/api/subscribe/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, cycle })
      }).then(r=>r.json()).then(d=>{
        if(d.url) window.location = d.url
        if(d.mode === 'invoice') setSelected(plan)
      })
    } else {
      setSelected(plan)
    }
  }

  function submitInvoice(e){
    e.preventDefault()
    fetch(`${API_BASE}/api/subscribe/invoice-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, plan: selected, cycle })
    }).then(()=>setConfirmed(true))
  }

  if(confirmed){
    return <div className="min-h-screen bg-slate-950 text-white p-8">Thank you for subscribing.</div>
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <ConnectorBar status={status} />
      <h1 className="text-3xl mb-4">Join BlackRoad</h1>
      <BillingToggle cycle={cycle} setCycle={setCycle} />
      <div className="grid md:grid-cols-3 gap-6">
        {plans.map(p=> (
          <div key={p.key} className="border border-slate-700 p-6 rounded-lg bg-slate-900">
            <h2 className="text-xl mb-2">{p.name}</h2>
            <div className="text-2xl mb-4">${cycle==='monthly'?p.monthly:p.annual}/{cycle==='monthly'?'mo':'yr'}</div>
            <button className="px-4 py-2 rounded" style={{background:'#FF4FD8',color:'#000'}} onClick={()=>startCheckout(p.key)}>Select</button>
          </div>
        ))}
      </div>
      {selected && !status.stripe && (
        <form onSubmit={submitInvoice} className="mt-8 space-y-4 max-w-md">
          <input required type="email" placeholder="Email" className="w-full p-2 text-black" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} />
          <input type="text" placeholder="Full name" className="w-full p-2 text-black" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} />
          <input type="text" placeholder="Company" className="w-full p-2 text-black" value={form.company} onChange={e=>setForm({...form,company:e.target.value})} />
          <textarea placeholder="Address" className="w-full p-2 text-black" value={form.address} onChange={e=>setForm({...form,address:e.target.value})}></textarea>
          <textarea placeholder="Notes" className="w-full p-2 text-black" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}></textarea>
          <button type="submit" className="px-4 py-2 rounded" style={{background:'#FF4FD8',color:'#000'}}>Submit</button>
        </form>
      )}
    </div>
  )
}

function BillingToggle({cycle,setCycle}){
  return (
    <div className="mb-6 space-x-2">
      <button className="px-4 py-2 rounded" style={{background: cycle==='monthly' ? '#FF4FD8' : '#1e293b', color: cycle==='monthly' ? '#000' : '#fff'}} onClick={()=>setCycle('monthly')}>Monthly</button>
      <button className="px-4 py-2 rounded" style={{background: cycle==='annual' ? '#FF4FD8' : '#1e293b', color: cycle==='annual' ? '#000' : '#fff'}} onClick={()=>setCycle('annual')}>Annual</button>
    </div>
  )
}

function ConnectorBar({status}){
  const connectors = ['stripe','mail','sheets','calendar','discord','webhooks']
  return (
    <div className="flex gap-2 mb-4 text-sm">
      {connectors.map(c => (
        <span key={c} className="px-2 py-1 rounded-full" style={{background: status[c] ? '#0096FF' : '#1e293b'}}>{c}</span>
      ))}
    </div>
  )
}
