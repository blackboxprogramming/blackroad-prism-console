import React from 'react';

export default function Release_Manage(){
  const create=async()=>{ const p={releaseId:'REL-1',version:'1.2.0',services:['svc-api'],date:new Date().toISOString().slice(0,10),notes:'minor',artifacts:['artifact.tgz']}; await fetch('/api/release/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(p)}); };
  const deploy=async()=>{ const p={releaseId:'REL-1',env:'prod',result:'success'}; await fetch('/api/release/deploy',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(p)}); };
  const view=async()=>{ const j=await (await fetch('/api/release/REL-1')).json(); alert(JSON.stringify(j)); };
  return <section><h2>Releases</h2>
    <div><button onClick={create}>Create</button><button onClick={deploy} style={{marginLeft:8}}>Deploy</button><button onClick={view} style={{marginLeft:8}}>View</button></div>
  </section>;
}
