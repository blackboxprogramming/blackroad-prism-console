import React, { useEffect, useState } from 'react';

export default function CMDB_CIs(){
  const [ci,setCi]=useState({ciId:'svc-api',type:'service',name:'API',env:'prod',owner:'platform',attrs:{tier:'gold'},rels:[{type:'runs_on',to:'host-1'}]});
  const [view,setView]=useState<any>(null);
  const save=async()=>{ await fetch('/api/cmdb/ci/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(ci)}); await load(); };
  const load=async()=>{ const j=await (await fetch(`/api/cmdb/ci/${ci.ciId}`)).json(); setView(j); };
  const discover=async()=>{ const payload={source:'manual',items:[{ciId:'host-1',type:'host',name:'vm-1',attrs:{os:'linux'}}]}; await fetch('/api/cmdb/discovery/ingest',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}); };
  const graph=async()=>{ const j=await (await fetch('/api/cmdb/graph?type=service')).json(); alert(JSON.stringify(j)); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>CMDB — CIs</h2>
    <div><input value={ci.ciId} onChange={e=>setCi({...ci,ciId:e.target.value})}/><input value={ci.name} onChange={e=>setCi({...ci,name:e.target.value})} style={{marginLeft:8}}/><select value={ci.type} onChange={e=>setCi({...ci,type:e.target.value})} style={{marginLeft:8}}><option>service</option><option>app</option><option>host</option><option>device</option><option>db</option><option>network</option><option>software</option></select><button onClick={save} style={{marginLeft:8}}>Save</button><button onClick={discover} style={{marginLeft:8}}>Discovery</button><button onClick={graph} style={{marginLeft:8}}>Graph</button></div>
    {view && <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(view,null,2)}</pre>}
  </section>;
}
