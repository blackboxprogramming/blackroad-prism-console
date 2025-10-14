import React, { useEffect, useState } from 'react';

export default function EXP_Flags(){
  const [flag,setFlag]=useState({key:'new_ui',description:'New UI rollout',default:'control',rules:[{segment:'all',variant:'treatment',rollout_pct:10}]});
  const [view,setView]=useState<any>(null);
  const save=async()=>{ await fetch('/api/exp/flags/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(flag)}); await load(); };
  const load=async()=>{ const j=await (await fetch(`/api/exp/flags/${flag.key}`)).json(); setView(j); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Feature Flags</h2>
    <div><input value={flag.key} onChange={e=>setFlag({...flag,key:e.target.value})}/><button onClick={save} style={{marginLeft:8}}>Save</button><button onClick={load} style={{marginLeft:8}}>Load</button></div>
    <textarea value={JSON.stringify(flag,null,2)} onChange={e=>setFlag(JSON.parse(e.target.value))} style={{width:'100%',height:140,marginTop:8}}/>
    {view && <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(view,null,2)}</pre>}
  </section>;
}
