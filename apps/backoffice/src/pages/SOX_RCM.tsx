import React, { useState } from 'react';

export default function SOX_RCM(){
  const [processId,setProcessId]=useState('OrderToCash');
  const [risks,setRisks]=useState('[{"id":"R1","desc":"Revenue recognition risk"}]');
  const [controls,setControls]=useState('[{"id":"C1","desc":"Revenue cutoff review","assertions":["Completeness","Accuracy"],"key":true,"frequency":"Monthly","owner":"Controller","linked_risk_ids":["R1"]}]');
  const [view,setView]=useState<any>(null);
  const upsert=async()=>{ await fetch('/api/sox/rcm/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({processId,risks:JSON.parse(risks),controls:JSON.parse(controls)})}); await load(); };
  const load=async()=>{ const j=await (await fetch(`/api/sox/rcm/${processId}`)).json(); setView(j); };
  return <section><h2>Risk & Controls Matrix</h2>
    <div><input value={processId} onChange={e=>setProcessId(e.target.value)}/><button onClick={upsert} style={{marginLeft:8}}>Save</button><button onClick={load} style={{marginLeft:8}}>Load</button></div>
    {view && <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(view,null,2)}</pre>}
  </section>;
}
