import React, { useMemo, useState } from 'react'

export default function Tasks({ items }){
  const cols = [
    { id: 'todo', title: 'To Do' },
    { id: 'inprogress', title: 'In Progress' },
    { id: 'review', title: 'Review' },
    { id: 'done', title: 'Done' },
  ]
  return (
    <div className="grid grid-cols-4 gap-4">
      {cols.map(c => (
        <div key={c.id} className="card p-3">
          <div className="font-semibold mb-3">{c.title}</div>
          <div className="space-y-3">
            {items.filter(t=>t.status===c.id).map(t=>(
              <div key={t.id} className="bg-slate-900/80 rounded-xl p-3 border border-slate-800/70">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{t.title}</div>
                  <div className="text-xs text-slate-400">{t.course}</div>
                </div>
                <div className="flex items-center justify-between mt-2 text-xs text-slate-400">
                  <span>Due {t.due}</span>
                  <span>RC +{t.reward}</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded mt-2">
                  <div className="h-2 bg-indigo-600 rounded" style={{ width: `${Math.round((t.progress||0)*100)}%`}} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
