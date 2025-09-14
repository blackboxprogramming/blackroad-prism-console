import React, { useEffect, useState } from 'react';

export default function BCDR_RestoreTests(){
  const [svc,setSvc]=useState('api'); const [backupId,setBackupId]=useState('bk-api-db');
  const create=async()=>{ const payload={service:svc,backupId,objective:{rto_min:30,rpo_min:15},plan:'restore to staging'}; await fetch('/api/bcdr/restore/test/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}); };
  const result=async()=>{ const testId=prompt('testId?')||''; await fetch('/api/bcdr/restore/test/result',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({testId,status:'pass',rto_s:1200,rpo_s:300,notes:'ok'})}); };
  const recent=async()=>{ const j=await (await fetch(`/api/bcdr/restore/test/recent?service=${svc}`)).json(); alert(JSON.stringify(j)); };
  useEffect(()=>{},[]);
  return <section><h2>Restore Tests</h2>
    <div><input value={svc} onChange={e=>setSvc(e.target.value)}/><input value={backupId} onChange={e=>setBackupId(e.target.value)} style={{marginLeft:8}}/><button onClick={create} style={{marginLeft:8}}>Create</button><button onClick={result} style={{marginLeft:8}}>Result</button><button onClick={recent} style={{marginLeft:8}}>Recent</button></div>
  </section>;
}
