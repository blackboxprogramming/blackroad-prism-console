import React from 'react'
import { Rocket, GitBranch, GitCommit } from 'lucide-react'

export default function Timeline({ items }){
  return (
    <div className="space-y-3">
      {items.map((it)=> (
        <div key={it.id} className="card p-4">
          <div className="text-sm text-slate-400">{new Date(it.time).toLocaleString()}</div>
          <div className="mt-1 text-slate-100">
            {it.agent ? (<span className="font-semibold">{it.agent} agent</span>) : null} {it.text}
            {it.by ? <span className="text-slate-400"> — {it.by}</span> : null}
          </div>
        </div>
      ))}
    </div>
  )
}
