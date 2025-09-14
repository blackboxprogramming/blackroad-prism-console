import React, { useEffect, useState } from 'react';

export default function ELT_Lineage(){
  const [nodes,setNodes]=useState('[{"id":"crm.contacts","type":"table","props":{"layer":"source"}},{"id":"silver.contacts","type":"table","props":{"layer":"silver"}},{"id":"silver.contacts.email","type":"column","props":{}}]');
  const [edges,setEdges]=useState('[{"from":"crm.contacts","to":"silver.contacts","type":"derives"},{"from":"crm.contacts.email","to":"silver.contacts.email","type":"derives"}]');
  const [view,setView]=useState<any>({});
  const upsert=async()=>{ await fetch('/api/elt/lineage/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({nodes:JSON.parse(nodes),edges:JSON.parse(edges)})}); await query(); };
  const query=async()=>{ const j=await (await fetch('/api/elt/lineage/query?type=node')).json(); setView(j); };
  useEffect(()=>{ query(); },[]);
  return <section><h2>Lineage</h2>
    <textarea value={nodes} onChange={e=>setNodes(e.target.value)} style={{width:'100%',height:140}}/><textarea value={edges} onChange={e=>setEdges(e.target.value)} style={{width:'100%',height:120,marginTop:8}}/>
    <div><button onClick={upsert}>Upsert</button><button onClick={query} style={{marginLeft:8}}>Query</button></div>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(view,null,2)}</pre>
  </section>;
}
