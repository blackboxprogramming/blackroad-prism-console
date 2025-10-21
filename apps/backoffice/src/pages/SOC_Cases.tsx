import React, { useState } from 'react';

export default function SOC_Cases(){
  const [id,setId]=useState(''); const [title,setTitle]=useState('Case'); const [severity,setSeverity]=useState('medium'); const [alerts,setAlerts]=useState('[]'); const [items,setItems]=useState<any[]>([]);
  const create=async()=>{ const j=await (await fetch('/api/soc/cases/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title,severity,alerts:JSON.parse(alerts)})})).json(); setId(j.id); };
  const load=async()=>{ const st=prompt('state filter? (open|closed)','')||''; const j=await (await fetch(`/api/soc/cases/recent${st?`?state=${st}`:''}`)).json(); setItems(j.items||[]); };
  const note=async()=>{ const text=prompt('note?')||''; await fetch(`/api/soc/cases/${id}/note`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({author:'analyst',text})}); };
  const task=async()=>{ const t=prompt('task?')||''; await fetch(`/api/soc/cases/${id}/task`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title:t,assignee:'analyst'})}); };
  const state=async()=>{ const s=prompt('state (open|closed)','closed')||'closed'; await fetch(`/api/soc/cases/${id}/state`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({state:s})}); };
  return <section><h2>Cases</h2>
    <div><input placeholder="title" value={title} onChange={e=>setTitle(e.target.value)}/><input value={severity} onChange={e=>setSeverity(e.target.value)} style={{marginLeft:8}}/><input value={alerts} onChange={e=>setAlerts(e.target.value)} style={{marginLeft:8,width:260}}/><button onClick={create} style={{marginLeft:8}}>Create</button><button onClick={load} style={{marginLeft:8}}>Load</button></div>
    <div style={{marginTop:8}}><input placeholder="case id" value={id} onChange={e=>setId(e.target.value)}/><button onClick={note} style={{marginLeft:8}}>Add Note</button><button onClick={task} style={{marginLeft:8}}>Add Task</button><button onClick={state} style={{marginLeft:8}}>Set State</button></div>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:8}}>{JSON.stringify(items,null,2)}</pre>
  </section>;
}
