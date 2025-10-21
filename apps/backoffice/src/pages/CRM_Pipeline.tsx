
import React, { useEffect, useState } from 'react';

export default function CRM_Pipeline(){
  const [stages,setStages]=useState('[{"name":"Prospecting","probability":0.1,"order":1},{"name":"Qualification","probability":0.3,"order":2},{"name":"Proposal","probability":0.6,"order":3},{"name":"Commit","probability":0.9,"order":4},{"name":"Closed-Won","probability":1.0,"order":5}]');
  const save=async()=>{ await fetch('/api/crm/stages/set',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({stages:JSON.parse(stages),methodology:'MEDDPICC'})}); alert('Saved'); };
  const load=async()=>{ const j=await (await fetch('/api/crm/stages')).json(); setStages(JSON.stringify(j.stages||[],null,2)); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Pipeline Stages & Methodology</h2>
    <textarea value={stages} onChange={e=>setStages(e.target.value)} style={{width:'100%',height:180}}/>
    <div><button onClick={save} style={{marginTop:8}}>Save</button><button onClick={load} style={{marginLeft:8}}>Load</button></div>
  </section>;
}

