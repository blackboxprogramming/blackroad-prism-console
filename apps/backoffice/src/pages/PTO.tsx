import React, { useEffect, useState } from 'react';

export default function PTO(){
  const [pending,setPending]=useState<any[]>([]);
  const [mine,setMine]=useState<any[]>([]);
  const [emp,setEmp]=useState('');
  const req = async ()=> {
    const employeeId = prompt('Employee ID/email?')||''; const start=prompt('Start (YYYY-MM-DD)?')||''; const end=prompt('End (YYYY-MM-DD)?')||'';
    await fetch('/api/hr/pto/request',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({employeeId,start,end})}); await load();
  };
  const approve = async (id:string, d='approve')=>{ await fetch('/api/hr/pto/approve',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({requestId:id,approverId:'manager',decision:d})}); await load(); };
  const load = async ()=> {
    const p = await (await fetch('/api/hr/pto/pending')).json(); setPending(p.items||[]);
    if(emp){ const m = await (await fetch(`/api/hr/pto/my?employeeId=${encodeURIComponent(emp)}`)).json(); setMine(m.items||[]); }
  };
  useEffect(()=>{ load(); },[emp]);
  return <section><h2>PTO</h2><div><button onClick={req}>Request</button><input placeholder="My ID/email" value={emp} onChange={e=>setEmp(e.target.value)} style={{marginLeft:8}}/><button onClick={load} style={{marginLeft:8}}>Refresh</button></div>
    <h3>Pending</h3><ul>{pending.map((x:any)=><li key={x.id}>{x.employeeId} {x.start}→{x.end} — <button onClick={()=>approve(x.id,'approve')}>Approve</button> <button onClick={()=>approve(x.id,'reject')}>Reject</button></li>)}</ul>
    <h3>Mine</h3><ul>{mine.map((x:any)=><li key={x.id}>{x.start}→{x.end} — {x.status}</li>)}</ul>
  </section>;
}
