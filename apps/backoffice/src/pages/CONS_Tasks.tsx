import React, { useEffect, useState } from 'react';

export default function CONS_Tasks(){
  const [period,setPeriod]=useState(new Date().toISOString().slice(0,7)); const [tasks,setTasks]=useState('[{"id":"TB-IMP","title":"Import TB","owner":"GL","due":"'+new Date().toISOString().slice(0,10)+'","done":false}]'); const [view,setView]=useState<any>(null);
  const save=async()=>{ await fetch('/api/cons/tasks/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({period,tasks:JSON.parse(tasks)})}); await load(); };
  const load=async()=>{ const j=await (await fetch(`/api/cons/tasks/${period}`)).json(); setView(j); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Close Calendar & Tasks</h2>
    <div><input value={period} onChange={e=>setPeriod(e.target.value)}/><button onClick={save} style={{marginLeft:8}}>Save</button><button onClick={load} style={{marginLeft:8}}>Load</button></div>
    {view && <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(view,null,2)}</pre>}
  </section>;
}
