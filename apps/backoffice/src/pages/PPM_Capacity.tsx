import React, { useEffect, useState } from 'react';

export default function PPM_Capacity(){
  const [body,setBody]=useState({period:new Date().toISOString().slice(0,7),teams:[{team:'Platform',capacity_pts:60},{team:'Product',capacity_pts:40}],allocations:[{initiativeId:'INIT-1',team:'Product',pts:20}]});
  const [view,setView]=useState<any>({});
  const setCap=async()=>{ await fetch('/api/ppm/capacity/set',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}); await summary(); };
  const summary=async()=>{ const j=await (await fetch(`/api/ppm/capacity/summary?period=${body.period}`)).json(); setView(j); };
  useEffect(()=>{ summary(); },[]);
  return <section><h2>Capacity & Allocations</h2>
    <div><button onClick={setCap}>Set Capacity</button><button onClick={summary} style={{marginLeft:8}}>Summary</button></div>
    <textarea value={JSON.stringify(body,null,2)} onChange={e=>setBody(JSON.parse(e.target.value))} style={{width:'100%',height:150,marginTop:8}}/>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(view,null,2)}</pre>
  </section>;
}
