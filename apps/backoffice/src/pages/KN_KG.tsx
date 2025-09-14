import React, { useEffect, useState } from 'react';

export default function KN_KG(){
  const [nodes,setNodes]=useState('[{"id":"acct:ACME","type":"account","props":{"name":"Acme"}},{"id":"doc:DOC-1","type":"doc","props":{"title":"MSA v1"}}]');
  const [edges,setEdges]=useState('[{"from":"acct:ACME","to":"doc:DOC-1","type":"has_contract"}]'); const [view,setView]=useState<any>({});
  const upsert=async()=>{ await fetch('/api/kn/kg/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({nodes:JSON.parse(nodes),edges:JSON.parse(edges)})}); await query(); };
  const query=async()=>{ const j=await (await fetch('/api/kn/kg/query?type=node')).json(); setView(j); };
  useEffect(()=>{ query(); },[]);
  return <section><h2>Knowledge Graph</h2>
    <textarea value={nodes} onChange={e=>setNodes(e.target.value)} style={{width:'100%',height:120}}/><textarea value={edges} onChange={e=>setEdges(e.target.value)} style={{width:'100%',height:100,marginTop:8}}/>
    <div><button onClick={upsert}>Upsert</button><button onClick={query} style={{marginLeft:8}}>Query</button></div>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(view,null,2)}</pre>
  </section>;
}
