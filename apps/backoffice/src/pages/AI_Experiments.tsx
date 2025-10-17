import React, { useState } from 'react';

export default function AI_Experiments(){
  const [name,setName]=useState('ab-test'); const [variants,setVariants]=useState('[{"model":"gpt-4o","promptKey":"assistant"}]'); const [datasetKey,setDatasetKey]=useState('sample'); const [id,setId]=useState('');
  const create=async()=>{ const j=await (await fetch('/api/ai/experiments/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,variants:JSON.parse(variants),datasetKey})})).json(); setId(j.id); };
  const run=async()=>{ await fetch('/api/ai/experiments/run',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})}); alert('Ran'); };
  return <section><h2>Experiments</h2>
    <div><input value={name} onChange={e=>setName(e.target.value)} /><input value={datasetKey} onChange={e=>setDatasetKey(e.target.value)} style={{marginLeft:8}}/>
      <textarea value={variants} onChange={e=>setVariants(e.target.value)} style={{width:'100%',height:120,marginTop:8}}/>
      <div><button onClick={create}>Create</button><input placeholder="id" value={id} onChange={e=>setId(e.target.value)} style={{marginLeft:8}}/><button onClick={run} style={{marginLeft:8}}>Run</button></div>
    </div>
  </section>;
}
