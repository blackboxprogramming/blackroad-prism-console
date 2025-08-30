import React, { useEffect, useState } from 'react'
import { fetchRoadbookChapters, fetchRoadbookChapter, searchRoadbook } from '../api'

export default function Roadbook(){
  const [chapters, setChapters] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [search, setSearch] = useState('')
  const [results, setResults] = useState([])

  useEffect(()=>{ (async()=>{ setChapters(await fetchRoadbookChapters()) })() }, [])

  async function openChapter(id){
    setActiveId(id)
    const ch = await fetchRoadbookChapter(id)
    setChapters(prev => prev.map(c => c.id===id ? ch : c))
  }

  async function handleSearch(e){
    e.preventDefault()
    setResults(await searchRoadbook(search))
  }

  const activeIndex = chapters.findIndex(c=>c.id===activeId)
  function goto(idx){ if(idx>=0 && idx<chapters.length) openChapter(chapters[idx].id) }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <input className="input flex-1" placeholder="Search roadbook" value={search} onChange={e=>setSearch(e.target.value)} />
        <button className="btn" type="submit" style={{background:'var(--accent)'}}>Search</button>
      </form>

      {results.length>0 && (
        <div className="card p-3">
          {results.map(r=> (
            <div key={r.id} className="mb-2 cursor-pointer" onClick={()=>openChapter(r.id)}>
              <div className="font-semibold" style={{color:'var(--accent)'}}>{r.title}</div>
              <div className="text-sm text-slate-400">{r.snippet}...</div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        {chapters.map(ch => (
          <details key={ch.id} open={ch.id===activeId} className="card p-4">
            <summary className="cursor-pointer font-semibold" style={{color:'var(--accent)'}} onClick={()=>openChapter(ch.id)}>{ch.title}</summary>
            {ch.content && <div className="mt-2" style={{color:'var(--accent-2)'}}>{ch.content}</div>}
          </details>
        ))}
      </div>

      {activeId && (
        <div className="flex gap-2 items-center">
          <button className="btn" style={{background:'var(--accent-2)'}} onClick={()=>goto(activeIndex-1)} disabled={activeIndex<=0}>Prev</button>
          <button className="btn" style={{background:'var(--accent-3)'}} onClick={()=>goto(activeIndex+1)} disabled={activeIndex>=chapters.length-1}>Next</button>
          <select className="input" value={activeId} onChange={e=>openChapter(e.target.value)}>
            {chapters.map(c=> <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>
      )}
    </div>
  )
}
