import React, { useEffect, useState } from 'react';

export default function OBS_Services(){
  const [s,setS]=useState({service:'api',owner:'platform',repo:'https://github.com/blackroad/api',runtime:'node20',tier:'gold',links:{runbook:'',dashboard:''}});
  const [view,setView]=useState<any>(null);
  const save=async()=>{ await fetch('/api/obs/services/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(s)}); await load(); };
  const load=async()=>{ const j=await (await fetch(`/api/obs/services/${s.service}`)).json(); setView(j); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Observability — Services</h2>
    <div><input value={s.service} onChange={e=>setS({...s,service:e.target.value})}/><input value={s.owner} onChange={e=>setS({...s,owner:e.target.value})} style={{marginLeft:8}}/><input value={s.runtime} onChange={e=>setS({...s,runtime:e.target.value})} style={{marginLeft:8}}/><select value={s.tier} onChange={e=>setS({...s,tier:e.target.value})} style={{marginLeft:8}}><option>gold</option><option>silver</option><option>bronze</option></select><button onClick={save} style={{marginLeft:8}}>Save</button></div>
    {view && <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(view,null,2)}</pre>}
  </section>;
}
