import React, { useEffect, useState } from 'react';

export default function BCDR_Policies(){
  const [s,setS]=useState('api'); const [policy,setPolicy]=useState('{"service":"api","rto_min":30,"rpo_min":15,"tier":"gold","dependencies":["db-core"]}');
  const [view,setView]=useState<any>(null);
  const save=async()=>{ await fetch('/api/bcdr/policy/set',{method:'POST',headers:{'Content-Type':'application/json'},body:policy}); await load(); };
  const load=async()=>{ const j=await (await fetch(`/api/bcdr/policy/${s}`)).json(); setView(j); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>BCP/DR Policies (RTO/RPO)</h2>
    <div><input value={s} onChange={e=>setS(e.target.value)}/><button onClick={save} style={{marginLeft:8}}>Save</button><button onClick={load} style={{marginLeft:8}}>Load</button></div>
    <textarea value={policy} onChange={e=>setPolicy(e.target.value)} style={{width:'100%',height:120,marginTop:8}}/>
    {view && <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(view,null,2)}</pre>}
  </section>;
}
