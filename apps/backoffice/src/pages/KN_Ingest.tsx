import React, { useEffect, useState } from 'react';

export default function KN_Ingest(){
  const [space,setSpace]=useState('default');
  const [payload,setPayload]=useState('{"connector":"clm","space":"default","docs":[{"docId":"DOC-1","title":"MSA v1","text":"Master Service Agreement ...","labels":{"type":"MSA"},"source":"clm"}]}');
  const ingest=async()=>{ await fetch('/api/kn/ingest',{method:'POST',headers:{'Content-Type':'application/json'},body:payload}); };
  const build=async()=>{ await fetch('/api/kn/index/build',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({space})}); };
  const view=async()=>{ const j=await (await fetch(`/api/kn/index/${space}`)).json(); alert(JSON.stringify(j)); };
  useEffect(()=>{},[]);
  return <section><h2>Ingest & Index</h2>
    <textarea value={payload} onChange={e=>setPayload(e.target.value)} style={{width:'100%',height:140}}/><div><input value={space} onChange={e=>setSpace(e.target.value)}/><button onClick={ingest} style={{marginLeft:8}}>Ingest</button><button onClick={build} style={{marginLeft:8}}>Build</button><button onClick={view} style={{marginLeft:8}}>View</button></div>
  </section>;
}
