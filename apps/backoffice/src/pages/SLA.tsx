import React, { useState } from 'react';

export default function SLA(){
  const [id,setId]=useState(''); const [status,setStatus]=useState<any>(null);
  const apply=async()=>{ await fetch('/api/support/sla/apply',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})}); await check(); };
  const check=async()=>{ if(!id) return; const j=await (await fetch(`/api/support/sla/status/${id}`)).json(); setStatus(j); };
  return <section><h2>SLA</h2>
    <input placeholder="Ticket ID" value={id} onChange={e=>setId(e.target.value)}/>
    <button onClick={apply} style={{marginLeft:8}}>Apply</button>
    <button onClick={check} style={{marginLeft:8}}>Check</button>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{status?JSON.stringify(status,null,2):''}</pre>
  </section>;
}
