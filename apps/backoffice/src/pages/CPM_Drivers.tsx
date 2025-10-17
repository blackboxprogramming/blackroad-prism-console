import React, { useState } from 'react';

export default function CPM_Drivers(){
  const [treeId,setTreeId]=useState('finance'); const [name,setName]=useState('Finance Drivers');
  const [nodes,setNodes]=useState('[{"id":"ARR","label":"ARR","formula":"MRR*12","inputs":["MRR"]}]');
  const [view,setView]=useState<any>(null);
  const save=async()=>{ await fetch('/api/cpm/drivers/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({treeId,name,nodes:JSON.parse(nodes)})}); alert('Saved'); };
  const load=async()=>{ const j=await (await fetch(`/api/cpm/drivers/${treeId}`)).json(); setView(j); };
  const evaluate=async()=>{ const j=await (await fetch('/api/cpm/drivers/evaluate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({treeId,assumptions:{MRR:100000}})})).json(); alert(JSON.stringify(j)); };
  return <section><h2>Driver Trees</h2>
    <div><input value={treeId} onChange={e=>setTreeId(e.target.value)}/><input value={name} onChange={e=>setName(e.target.value)} style={{marginLeft:8}}/><button onClick={save} style={{marginLeft:8}}>Save</button><button onClick={load} style={{marginLeft:8}}>Load</button><button onClick={evaluate} style={{marginLeft:8}}>Evaluate</button></div>
    {view && <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(view,null,2)}</pre>}
  </section>;
}
