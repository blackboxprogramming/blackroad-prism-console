import React, { useEffect, useState, useRef } from 'react'
import { claudeChat, fetchClaudeHistory } from '../api'

export default function Claude({ socket }) {
  const [tab, setTab] = useState('chat')
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([])
  const messagesEndRef = useRef(null)

  useEffect(() => {
    fetchClaudeHistory().then(h => {
      const msgs = []
      h.forEach(({ prompt, response }) => {
        msgs.push({ role: 'user', content: prompt })
        msgs.push({ role: 'assistant', content: response })
      })
      setMessages(msgs)
    })
  }, [])

  useEffect(() => {
    if (!socket) return
    const handler = d => {
      setMessages(prev => {
        const last = prev[prev.length - 1]
        if (d.done) {
          if (last && last.role === 'assistant') {
            return [...prev.slice(0, -1), { ...last, streaming: false }]
          }
          return prev
        }
        if (last && last.role === 'assistant' && last.streaming) {
          return [...prev.slice(0, -1), { ...last, content: last.content + d.chunk, streaming: true }]
        }
        return [...prev, { role: 'assistant', content: d.chunk, streaming: true }]
      })
    }
    socket.on('claude:chat', handler)
    return () => socket.off('claude:chat', handler)
  }, [socket])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendPrompt(e) {
    e.preventDefault()
    if (!input.trim()) return
    setMessages(prev => [...prev, { role: 'user', content: input }, { role: 'assistant', content: '', streaming: true }])
    await claudeChat(input)
    setInput('')
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex border-b border-slate-800 mb-4">
        {['chat','canvas','editor','terminal'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`py-2 px-4 border-b-2 ${tab===t?'text-white':'text-slate-400 border-transparent'}`} style={tab===t?{borderColor:'var(--accent)'}:{}}>
            {t.charAt(0).toUpperCase()+t.slice(1)}
          </button>
        ))}
      </header>
      {tab==='chat' && (
        <div className="flex flex-col flex-1">
          <div className="flex-1 overflow-y-auto space-y-3 mb-2">
            {messages.map((m,i)=>(
              <div key={i} className={m.role==='user'?'text-right':'text-left'}>
                <div className="text-sm text-slate-400">{m.role}</div>
                <div className="inline-block px-3 py-2 rounded-xl bg-slate-800 text-slate-200 max-w-full whitespace-pre-wrap">{m.content}</div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={sendPrompt} className="mt-auto flex gap-2">
            <input className="input flex-1" value={input} onChange={e=>setInput(e.target.value)} placeholder="Ask Claude..." />
            <button className="px-3 py-2 rounded-xl text-white" style={{backgroundColor:'var(--accent)'}}>Send</button>
          </form>
          <div className="mt-6">
            <h2 className="text-sm text-slate-400 uppercase">History</h2>
            <ul className="space-y-1 mt-2 text-sm">
              {messages.reduce((acc, m, idx) => {
                if (m.role === 'user' && messages[idx+1]?.role === 'assistant') {
                  acc.push({ prompt: m.content, response: messages[idx+1].content })
                }
                return acc
              }, []).map((h,i)=>(
                <li key={i} className="text-slate-300">
                  <div>Q: {h.prompt}</div>
                  <div className="text-slate-500">A: {h.response}</div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      {tab!=='chat' && <div className="text-slate-400">Coming soon...</div>}
    </div>
  )
}

