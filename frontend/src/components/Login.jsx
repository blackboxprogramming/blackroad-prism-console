import React, { useState } from 'react'

export default function Login({ onLogin }){
  const [username, setUsername] = useState('root')
  const [password, setPassword] = useState('Codex2025')
  const [err, setErr] = useState(null)

  async function submit(e){
    e.preventDefault()
    setErr(null)
    try{
      await onLogin(username, password)
    }catch(e){
      setErr('Invalid credentials')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <form onSubmit={submit} className="w-full max-w-sm card p-6 space-y-4">
        <div className="text-xl font-semibold">Login</div>
        <div className="space-y-2">
          <label className="text-sm text-slate-300">Username</label>
          <input className="input w-full" value={username} onChange={e=>setUsername(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-slate-300">Password</label>
          <input type="password" className="input w-full" value={password} onChange={e=>setPassword(e.target.value)} />
        </div>
        {err && <div className="text-red-400 text-sm">{err}</div>}
        <button className="btn w-full">Enter</button>
      </form>
    </div>
  )
}
