import React, { useEffect, useState } from 'react';

export default function PSA_Time(){
  const [entry,setEntry]=useState({entryId:'TE-1',projectId:'PRJ-1',taskId:'T-1',userId:'u1',date:new Date().toISOString().slice(0,10),hours:6,notes:'work',billable:true});
  const [items,setItems]=useState<any[]>([]);
  const log=async()=>{ await fetch('/api/psa/time/log',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(entry)}); await load(); };
  const load=async()=>{ const j=await (await fetch(`/api/psa/time/recent?projectId=${entry.projectId}`)).json(); setItems(j.items||[]); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Time Entries</h2>
    <div><input value={entry.entryId} onChange={e=>setEntry({...entry,entryId:e.target.value})}/><input value={entry.projectId} onChange={e=>setEntry({...entry,projectId:e.target.value})} style={{marginLeft:8}}/><input value={entry.taskId} onChange={e=>setEntry({...entry,taskId:e.target.value})} style={{marginLeft:8}}/><input type="number" value={entry.hours} onChange={e=>setEntry({...entry,hours:Number(e.target.value)})} style={{marginLeft:8,width:90}}/><button onClick={log} style={{marginLeft:8}}>Log</button></div>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(items,null,2)}</pre>
  </section>;
}
