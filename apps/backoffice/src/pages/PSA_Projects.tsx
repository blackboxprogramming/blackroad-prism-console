import React, { useEffect, useState } from 'react';

export default function PSA_Projects(){
  const [p,setP]=useState({id:'PRJ-1',name:'Implementation',client:'ACME',start:'2025-01-01',end:'2025-06-30',manager:'pm1',currency:'USD',bill_model:'T&M'});
  const [task,setTask]=useState({projectId:'PRJ-1',taskId:'T-1',name:'Discovery',rate:180,cost_code:'SERV',capex:false});
  const [rate,setRate]=useState({role:'Consultant',rate:180,currency:'USD'});
  const [assign,setAssign]=useState({projectId:'PRJ-1',userId:'u1',role:'Consultant',start:'2025-01-01',end:'2025-06-30',allocation_pct:75});
  const [view,setView]=useState<any>(null);
  const saveP=async()=>{ await fetch('/api/psa/projects/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(p)}); await load(); };
  const saveT=async()=>{ await fetch('/api/psa/tasks/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(task)}); };
  const saveR=async()=>{ await fetch('/api/psa/rates/set',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(rate)}); };
  const saveA=async()=>{ await fetch('/api/psa/assign',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(assign)}); };
  const load=async()=>{ const j=await (await fetch(`/api/psa/projects/${p.id}`)).json(); setView(j); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>PSA Projects</h2>
    <div><input value={p.id} onChange={e=>setP({...p,id:e.target.value})}/><input value={p.name} onChange={e=>setP({...p,name:e.target.value})} style={{marginLeft:8}}/><input value={p.client} onChange={e=>setP({...p,client:e.target.value})} style={{marginLeft:8}}/>
      <select value={p.bill_model} onChange={e=>setP({...p,bill_model:e.target.value})} style={{marginLeft:8}}><option>T&M</option><option>Fixed</option><option>Milestone</option></select>
      <button onClick={saveP} style={{marginLeft:8}}>Save Project</button></div>
    <div style={{marginTop:8}}><input value={task.projectId} onChange={e=>setTask({...task,projectId:e.target.value})}/><input value={task.taskId} onChange={e=>setTask({...task,taskId:e.target.value})} style={{marginLeft:8}}/><input value={task.name} onChange={e=>setTask({...task,name:e.target.value})} style={{marginLeft:8}}/><input type="number" value={task.rate} onChange={e=>setTask({...task,rate:Number(e.target.value)})} style={{marginLeft:8,width:90}}/><button onClick={saveT} style={{marginLeft:8}}>Save Task</button></div>
    <div style={{marginTop:8}}><input value={rate.role} onChange={e=>setRate({...rate,role:e.target.value})}/><input type="number" value={rate.rate} onChange={e=>setRate({...rate,rate:Number(e.target.value)})} style={{marginLeft:8,width:90}}/><button onClick={saveR} style={{marginLeft:8}}>Set Rate</button></div>
    <div style={{marginTop:8}}><input value={assign.projectId} onChange={e=>setAssign({...assign,projectId:e.target.value})}/><input value={assign.userId} onChange={e=>setAssign({...assign,userId:e.target.value})} style={{marginLeft:8}}/><input value={assign.role} onChange={e=>setAssign({...assign,role:e.target.value})} style={{marginLeft:8}}/><button onClick={saveA} style={{marginLeft:8}}>Assign</button></div>
    {view && <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(view,null,2)}</pre>}
  </section>;
}
