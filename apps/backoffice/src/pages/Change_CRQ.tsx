import React from 'react';

export default function Change_CRQ(){
  const create=async()=>{ const payload={changeId:'CHG-1',ciId:'svc-api',title:'Deploy v1.2',type:'normal',risk:'med',window:{start:'2025-09-20T02:00:00Z',end:'2025-09-20T03:00:00Z'},plan:'rollout plan',backout:'rollback v1.1',requester:'alice'}; await fetch('/api/change/crq/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}); };
  const approve=async()=>{ await fetch('/api/change/crq/approve',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({changeId:'CHG-1',approver:'cab1',role:'CAB'})}); };
  const state=async()=>{ await fetch('/api/change/crq/state',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({changeId:'CHG-1',state:'approved'})}); };
  const view=async()=>{ const j=await (await fetch('/api/change/crq/CHG-1')).json(); alert(JSON.stringify(j)); };
  return <section><h2>Change Requests</h2>
    <div><button onClick={create}>Create</button><button onClick={approve} style={{marginLeft:8}}>Approve</button><button onClick={state} style={{marginLeft:8}}>State</button><button onClick={view} style={{marginLeft:8}}>View</button></div>
  </section>;
}
