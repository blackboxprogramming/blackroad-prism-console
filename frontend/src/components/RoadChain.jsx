import React, { useEffect, useState } from 'react'
import { fetchBlocks, fetchBlock } from '../api'

export default function RoadChain(){
  const [blocks, setBlocks] = useState([])
  const [expanded, setExpanded] = useState({})
  const [query, setQuery] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  useEffect(()=>{
    (async()=>{
      try{
        const b = await fetchBlocks()
        setBlocks(b)
      }catch(e){
        // Surface initial fetch issues so they aren't missed during debugging
        console.error('Failed to fetch initial blocks', e)
        setError('Failed to fetch initial blocks')
      }
    })()
  }, [])

  useEffect(() => {
    if (!query) {
      setResult(null)
      setError('')
    }
  }, [query])

  function toggle(hash){
    setExpanded(prev => ({ ...prev, [hash]: !prev[hash] }))
  }

  async function onSearch(e){
    e.preventDefault()
    if(!query) return
    try{
      const blk = await fetchBlock(query.trim())
      setResult(blk)
      setExpanded(prev => ({ ...prev, [blk.hash]: true }))
      setError('')
    }catch(err){
      setResult(null)
      setError('Block not found')
      console.error('Failed to fetch block', err)
    }
  }

  function Block({ block }){
    return (
      <div className="card p-3 mb-2" key={block.hash}>
        <div className="flex justify-between cursor-pointer" onClick={()=>toggle(block.hash)}>
          <div>
            <div className="font-medium">Height {block.height}</div>
            <div className="text-xs text-slate-400">{new Date(block.time).toLocaleString()}</div>
          </div>
          <div className="text-sm text-slate-400">{block.txs.length} txs</div>
        </div>
        {expanded[block.hash] && (
          <ul className="mt-2 text-sm" style={{color:'var(--accent-3)'}}>
            {block.txs.map(tx => (
              <li key={tx.hash} className="border-t border-slate-700/50 py-1">
                {tx.hash} — {tx.from} → {tx.to} ({tx.amount})
              </li>
            ))}
            {block.txs.length === 0 && <li className="border-t border-slate-700/50 py-1">No transactions</li>}
          </ul>
        )}
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4" style={{color:'var(--accent)'}}>RoadChain Explorer</h2>
      <form onSubmit={onSearch} className="mb-4 flex gap-2">
        <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search by height or hash" className="input flex-1" />
        <button className="btn" style={{backgroundColor:'var(--accent-2)'}}>Search</button>
      </form>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      {result && (
        <div className="mb-4">
          <div className="text-sm text-slate-400 mb-1">Search result:</div>
          <Block block={result} />
        </div>
      )}
      <div>{blocks.map(b => <Block block={b} key={b.hash} />)}</div>
    </div>
  )
}
