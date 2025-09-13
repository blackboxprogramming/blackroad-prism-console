import React, { useEffect, useState } from 'react';

export default function Training(){
  const [emp,setEmp]=useState(''); const [items,setItems]=useState<any[]>([]);
  const assign=async()=>{ const employeeId=prompt('Employee ID/email?')||''; const course=prompt('Course key?')||''; const due=prompt('Due (YYYY-MM-DD)?')||''; await fetch('/api/hr/training/assign',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({employeeId,course,due})}); await load(); };
  const complete=async()=>{ const assignmentId=prompt('Assignment ID?')||''; await fetch('/api/hr/training/complete',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({assignmentId})}); await load(); };
  const load=async()=>{ if(!emp) return; const j=await (await fetch(`/api/hr/training/pending?employeeId=${encodeURIComponent(emp)}`)).json(); setItems(j.items||[]); };
  useEffect(()=>{ if(emp) load(); },[emp]);
  return <section><h2>Training & Compliance</h2><div><button onClick={assign}>Assign</button><button onClick={complete} style={{marginLeft:8}}>Complete</button><input placeholder="Employee ID/email" value={emp} onChange={e=>setEmp(e.target.value)} style={{marginLeft:8}}/><button onClick={load} style={{marginLeft:8}}>Refresh</button></div>
    <ul>{items.map((x:any)=><li key={x.id}>{x.course} — due {x.due}</li>)}</ul>
  </section>;
}
