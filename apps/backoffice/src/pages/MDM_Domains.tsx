import React, { useEffect, useState } from 'react';

export default function MDM_Domains(){
  const [domains,setDomains]=useState('[{"name":"accounts","keys":["id","name","domain"]},{"name":"contacts","keys":["id","email","name"]},{"name":"vendors","keys":["id","name","country"]},{"name":"items","keys":["sku","description"]}]');
  const [view,setView]=useState<any>(null);
  const save=async()=>{ await fetch('/api/mdm/domains/set',{method:'POST',headers:{'Content-Type':'application/json'},body:domains}); await load(); };
  const load=async()=>{ const j=await (await fetch('/api/mdm/domains')).json(); setView(j); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>MDM Domains</h2>
    <textarea value={domains} onChange={e=>setDomains(e.target.value)} style={{width:'100%',height:160}}/>
    <div><button onClick={save}>Save</button><button onClick={load} style={{marginLeft:8}}>Load</button></div>
    {view && <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(view,null,2)}</pre>}
  </section>;
}
