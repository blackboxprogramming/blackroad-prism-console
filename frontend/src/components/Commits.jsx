import React from 'react'

export default function Commits({ items }){
  return (
    <div className="space-y-3">
      {items.map(c=>(
        <div key={c.id} className="card p-3">
          <div className="flex items-center justify-between">
            <div className="font-medium">{c.message}</div>
            <div className="text-xs text-slate-400">{new Date(c.time).toLocaleString()}</div>
          </div>
          <div className="text-xs text-slate-400 mt-1">by {c.author} • {c.hash}</div>
        </div>
      ))}
    </div>
  )
}
