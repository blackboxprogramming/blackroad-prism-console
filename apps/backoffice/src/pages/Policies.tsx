import React, { useEffect, useState } from 'react';

export default function Policies(){
  const [pub,setPub]=useState<any[]>([]); const [acks,setAcks]=useState<any[]>([]); const [emp,setEmp]=useState('');
  const publish=async()=>{ const key=prompt('Policy key?')||''; const title=prompt('Title?')||''; const version=prompt('Version?')||''; const url=prompt('URL?')||''; await fetch('/api/hr/policies/publish',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key,title,version,url})}); await refresh(); };
  const ack=async()=>{ const key=prompt('Policy key?')||''; const version=prompt('Version?')||''; const employeeId=prompt('Employee ID/email?')||''; await fetch('/api/hr/policies/ack',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key,employeeId,version})}); await refresh(); };
  const refresh=async()=>{ if(emp){ const j=await (await fetch(`/api/hr/policies/status?employeeId=${encodeURIComponent(emp)}`)).json(); setPub(j.published||[]); setAcks(j.acks||[]); } };
  useEffect(()=>{ refresh(); },[emp]);
  return <section><h2>Policies</h2><div><button onClick={publish}>Publish</button><button onClick={ack} style={{marginLeft:8}}>Acknowledge</button><input placeholder="Employee ID/email" value={emp} onChange={e=>setEmp(e.target.value)} style={{marginLeft:8}}/><button onClick={refresh} style={{marginLeft:8}}>Refresh</button></div>
    <h3>Published</h3><ul>{pub.map((p:any)=><li key={p.id}>{p.key} v{p.version} — {p.title}</li>)}</ul>
    <h3>Acknowledgements</h3><ul>{acks.map((a:any)=><li key={a.id}>{a.employeeId} — {a.key} v{a.version}</li>)}</ul>
  </section>;
}
