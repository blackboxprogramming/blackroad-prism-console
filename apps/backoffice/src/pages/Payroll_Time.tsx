import React, { useEffect, useState } from 'react';

export default function Payroll_Time(){
  const [t,setT]=useState({employeeId:'E-100',date:new Date().toISOString().slice(0,10),hours:8,projectId:'PRJ-1',taskId:'T-1'});
  const [items,setItems]=useState<any[]>([]);
  const log=async()=>{ await fetch('/api/payroll/time/log',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(t)}); await load(); };
  const load=async()=>{ const j=await (await fetch(`/api/payroll/time/recent?employeeId=${t.employeeId}`)).json(); setItems(j.items||[]); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Time Capture (Payroll)</h2>
    <div><input value={t.employeeId} onChange={e=>setT({...t,employeeId:e.target.value})}/><input value={t.date} onChange={e=>setT({...t,date:e.target.value})} style={{marginLeft:8}}/><input type="number" value={t.hours} onChange={e=>setT({...t,hours:Number(e.target.value)})} style={{marginLeft:8,width:90}}/><button onClick={log} style={{marginLeft:8}}>Log</button></div>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(items,null,2)}</pre>
  </section>;
}

