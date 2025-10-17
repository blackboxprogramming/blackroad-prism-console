import React, { useEffect, useState } from 'react';

export default function SOC_Alerts(){
  const [items,setItems]=useState<any[]>([]);
  const [status,setStatus]=useState('');
  const load=async()=>{ const j=await (await fetch(`/api/soc/alerts/recent${status?`?status=${status}`:''}`)).json(); setItems(j.items||[]); };
  const triage=async(id:string)=>{ const s=prompt('status (open|closed|suppressed)','closed')||'closed'; await fetch(`/api/soc/alerts/${id}/triage`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:s,analyst:'analyst',notes:'triaged'})}); await load(); };
  useEffect(()=>{ load(); },[status]);
  return <section><h2>Alerts</h2>
    <div><select value={status} onChange={e=>setStatus(e.target.value)}><option value="">All</option><option>open</option><option>closed</option></select><button onClick={load} style={{marginLeft:8}}>Refresh</button></div>
    <table border={1} cellPadding={6} style={{marginTop:8}}><thead><tr><th>Id</th><th>Source</th><th>Rule</th><th>Status</th><th>Action</th></tr></thead>
      <tbody>{items.map(a=><tr key={a.id}><td>{a.id}</td><td>{a.source}</td><td>{a.ruleId||''}</td><td>{a.status}</td><td><button onClick={()=>triage(a.id)}>Triage</button></td></tr>)}</tbody></table>
  </section>;
}
