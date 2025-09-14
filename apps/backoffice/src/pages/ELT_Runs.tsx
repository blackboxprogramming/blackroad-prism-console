import React, { useEffect, useState } from 'react';

export default function ELT_Runs(){
  const [pipelineId,setPid]=useState('crm_to_silver_contacts'); const [runId,setRid]=useState(''); const [recent,setRecent]=useState<any>({});
  const run=async()=>{ const j=await (await fetch('/api/elt/dag/run',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pipelineId})})).json(); setRid(j.runId); await list(); };
  const status=async()=>{ if(!runId) return; const j=await (await fetch(`/api/elt/dag/status/${runId}`)).json(); alert(JSON.stringify(j)); };
  const list=async()=>{ const j=await (await fetch(`/api/elt/dag/recent?pipelineId=${pipelineId}`)).json(); setRecent(j); };
  useEffect(()=>{ list(); },[]);
  return <section><h2>Runs</h2>
    <div><input value={pipelineId} onChange={e=>setPid(e.target.value)}/><button onClick={run} style={{marginLeft:8}}>Run</button><input placeholder="runId" value={runId} onChange={e=>setRid(e.target.value)} style={{marginLeft:8}}/><button onClick={status} style={{marginLeft:8}}>Status</button><button onClick={list} style={{marginLeft:8}}>Recent</button></div>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(recent,null,2)}</pre>
  </section>;
}
