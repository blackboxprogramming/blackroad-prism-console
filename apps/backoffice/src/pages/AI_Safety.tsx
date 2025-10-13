import React, { useEffect, useState } from 'react';

export default function AI_Safety(){
  const [yaml,setYaml]=useState('p0_banned: ["violence","weapons"]'); const [pol,setPol]=useState<any>({});
  const save=async()=>{ await fetch('/api/ai/safety/policy',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:'default',yaml})}); await load(); };
  const load=async()=>{ const j=await (await fetch('/api/ai/safety/policies')).json(); setPol(j); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Safety & Guardrails</h2>
    <textarea value={yaml} onChange={e=>setYaml(e.target.value)} style={{width:'100%',height:120}}/>
    <div><button onClick={save} style={{marginTop:8}}>Save Policy</button></div>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:8}}>{JSON.stringify(pol,null,2)}</pre>
  </section>;
}
