import { useEffect, useState } from 'react'
export default function AgentInbox(){
  const [msgs,setMsgs]=useState(null)
  useEffect(()=>{ fetch('/inbox.json',{cache:'no-cache'}).then(r=>r.json()).then(setMsgs).catch(()=>setMsgs({messages:[]})) },[])
  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-3">Agent Inbox</h2>
      {!msgs ? <p>Loading…</p> :
        (msgs.messages?.length ? (
          <ul className="space-y-2">
            {msgs.messages.map((m,i)=>(
              <li key={i} className="p-2 rounded bg-white/5 border border-white/10">
                <div className="text-xs opacity-70">{new Date(m.ts).toLocaleString()} — <b>{m.from}</b></div>
                <div className="mt-1">{m.text}</div>
              </li>
            ))}
          </ul>
        ) : <p>No messages yet. Use <code>/say your message</code> on any PR/Issue.</p>)
      }
      <p className="text-xs opacity-60 mt-3">Add a message via ChatOps: <code>/say Hello team</code></p>
    </div>
  )
}
