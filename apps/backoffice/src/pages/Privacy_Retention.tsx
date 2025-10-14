import React, { useEffect, useState } from 'react';

export default function Privacy_Retention(){
  const [sched,setSched]=useState('{"schedules":[{"dataset":"crm.contacts","rule":"P3Y","basis":"legal","owner":"legal"}]}');
  const [hold,setHold]=useState('{"holdId":"hold-1","dataset":"crm.contacts","reason":"litigation","placed_by":"legal"}');
  const [recent,setRecent]=useState<any>({});
  const save=async()=>{ await fetch('/api/privacy/retention/set',{method:'POST',headers:{'Content-Type':'application/json'},body:sched}); };
  const place=async()=>{ await fetch('/api/privacy/holds/place',{method:'POST',headers:{'Content-Type':'application/json'},body:hold}); await load(); };
  const load=async()=>{ const j=await (await fetch('/api/privacy/holds/recent')).json(); setRecent(j); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Retention & Legal Holds</h2>
    <textarea value={sched} onChange={e=>setSched(e.target.value)} style={{width:'100%',height:120}}/><div><button onClick={save}>Save Schedules</button></div>
    <textarea value={hold} onChange={e=>setHold(e.target.value)} style={{width:'100%',height:100,marginTop:8}}/><div><button onClick={place}>Place Hold</button><button onClick={load} style={{marginLeft:8}}>Recent</button></div>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(recent,null,2)}</pre>
  </section>;
}
