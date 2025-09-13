import React, { useEffect, useState } from 'react';

export default function SupportInbox(){
  const [items,setItems]=useState<any[]>([]);
  const [status,setStatus]=useState('');
  const [macro,setMacro]=useState('acknowledge');
  const refresh=async()=>{ const j=await (await fetch(`/api/support/tickets/recent${status?`?status=${status}`:''}`)).json(); setItems(j.items||[]); };
  const runMacro=async(id:string)=>{ await fetch('/api/support/macros/run',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,macro})}); await refresh(); };
  const assign=async(id:string)=>{ const assignee=prompt('Assignee?')||''; await fetch(`/api/support/tickets/${id}/update`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({assignee})}); await refresh(); };
  useEffect(()=>{ refresh(); },[status]);
  return <section><h2>Support Inbox</h2>
    <div><select value={status} onChange={e=>setStatus(e.target.value)}><option value="">All</option><option>open</option><option>pending</option><option>solved</option></select>
      <button onClick={refresh} style={{marginLeft:8}}>Refresh</button>
      <select value={macro} onChange={e=>setMacro(e.target.value)} style={{marginLeft:8}}><option>acknowledge</option><option>request_logs</option><option>close_resolved</option></select>
    </div>
    <table border={1} cellPadding={6} style={{marginTop:8}}>
      <thead><tr><th>Id</th><th>Subject</th><th>Status</th><th>Requester</th><th>Assignee</th><th>Actions</th></tr></thead>
      <tbody>{items.map((t:any)=><tr key={t.id}><td>{t.id}</td><td>{t.subject}</td><td>{t.status}</td><td>{t.requester}</td><td>{t.assignee||''}</td>
        <td><button onClick={()=>assign(t.id)}>Assign</button><button onClick={()=>runMacro(t.id)} style={{marginLeft:6}}>Run Macro</button></td></tr>)}</tbody>
    </table>
  </section>;
}
