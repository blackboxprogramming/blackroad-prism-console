import React, { useEffect, useState } from 'react';

export default function PPM_Initiatives_Roadmap(){
  const [init,setInit]=useState({id:'INIT-1',name:'Self-serve onboarding',owner:'prod',start:'2025-09-15',end:'2025-12-15',value_score:8,effort:13,okr_links:['OBJ-1'],stage:'planning',tags:['growth']});
  const [rm,setRm]=useState({key:'2025Q4',name:'Q4 Roadmap',lanes:[{id:'growth',name:'Growth'},{id:'platform',name:'Platform'}],items:[{initiativeId:'INIT-1',laneId:'growth',start:'2025-09-15',end:'2025-12-15',percent:10}]});
  const [iv,setIv]=useState<any>(null); const [rv,setRv]=useState<any>(null);
  const saveI=async()=>{ await fetch('/api/ppm/initiatives/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(init)}); await loadI(); };
  const saveR=async()=>{ await fetch('/api/ppm/roadmaps/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(rm)}); await loadR(); };
  const loadI=async()=>{ const j=await (await fetch(`/api/ppm/initiatives/${init.id}`)).json(); setIv(j); };
  const loadR=async()=>{ const j=await (await fetch(`/api/ppm/roadmaps/${rm.key}`)).json(); setRv(j); };
  useEffect(()=>{ loadI(); loadR(); },[]);
  return <section><h2>Initiatives & Roadmap</h2>
    <div><button onClick={saveI}>Save Initiative</button><button onClick={saveR} style={{marginLeft:8}}>Save Roadmap</button></div>
    <textarea value={JSON.stringify(init,null,2)} onChange={e=>setInit(JSON.parse(e.target.value))} style={{width:'100%',height:150,marginTop:8}}/>
    <textarea value={JSON.stringify(rm,null,2)} onChange={e=>setRm(JSON.parse(e.target.value))} style={{width:'100%',height:150,marginTop:8}}/>
    {iv && <pre style={{background:'#f7f7f7',padding:8,marginTop:8}}>{JSON.stringify(iv,null,2)}</pre>}
    {rv && <pre style={{background:'#f7f7f7',padding:8,marginTop:8}}>{JSON.stringify(rv,null,2)}</pre>}
  </section>;
}
