import React, { useState } from 'react';

export default function DQ_Contracts(){
  const [dataset,setDataset]=useState('finance_arr');
  const [producer,setProducer]=useState('warehouse');
  const [consumer,setConsumer]=useState('bi');
  const [schemaName,setSchemaName]=useState('finance_arr');
  const [obligations,setObligations]=useState('{"freshness_min":60}');
  const [view,setView]=useState<any>(null);
  const upsert=async()=>{ await fetch('/api/dq/contracts/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({dataset,producer,consumer,schemaName,obligations:JSON.parse(obligations)})}); await load(); };
  const load=async()=>{ const j=await (await fetch(`/api/dq/contracts/${dataset}`)).json(); setView(j); };
  return <section><h2>Data Contracts</h2>
    <div><input value={dataset} onChange={e=>setDataset(e.target.value)}/><input value={producer} onChange={e=>setProducer(e.target.value)} style={{marginLeft:8}}/><input value={consumer} onChange={e=>setConsumer(e.target.value)} style={{marginLeft:8}}/><input value={schemaName} onChange={e=>setSchemaName(e.target.value)} style={{marginLeft:8}}/><button onClick={upsert} style={{marginLeft:8}}>Upsert</button><button onClick={load} style={{marginLeft:8}}>Load</button></div>
    {view && <pre style={{background:'#f7f7f7',padding:8,marginTop:8}}>{JSON.stringify(view,null,2)}</pre>}
  </section>;
}
