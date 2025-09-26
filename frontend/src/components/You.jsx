import React, { useEffect, useState } from 'react'
import { fetchProfile, getNotes, setNotes } from '../api'

export default function You(){
  const [profile, setProfile] = useState(null)
  const [notes, setNotesState] = useState('')

  useEffect(()=>{
    (async ()=>{
      const p = await fetchProfile()
      setProfile(p)
      const n = await getNotes()
      setNotesState(n || '')
    })()
  }, [])

  if(!profile) return null

  return (
    <div className="space-y-6">
      <section className="card p-4">
        <div className="font-semibold text-lg">{profile.username}</div>
        <div className="text-sm text-slate-400">Plan: {profile.plan}</div>
        <div className="text-sm text-slate-400">Last login: {new Date(profile.lastLogin).toLocaleString()}</div>
        {profile.plan === 'free' && (
          <button className="mt-4 px-3 py-1.5 rounded-xl text-white" style={{ backgroundColor: 'var(--accent-2)' }}>
            Upgrade Plan
          </button>
        )}
      </section>

      <section>
        <h2 className="font-semibold mb-2">Tasks</h2>
        <ul className="space-y-2">
          {profile.tasks.map(t => (
            <li key={t.id} className="card p-2 text-sm">{t.title}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="font-semibold mb-2">Projects</h2>
        <ul className="space-y-2">
          {profile.projects.map(p => (
            <li key={p.id} className="card p-2 text-sm">{p.name}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="font-semibold mb-2">Notes</h2>
        <textarea className="input w-full h-32" value={notes} onChange={e=>setNotesState(e.target.value)} onBlur={()=>setNotes(notes)} />
      </section>
    </div>
  )
}
