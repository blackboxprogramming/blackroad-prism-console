import React, { useState } from 'react';

export default function CS_QBR(){
  const [a,setA]=useState('{"accountId":"A-1","date":"2025-09-15","notes":"Usage up 20% QoQ","actions":[{"owner":"csm","title":"Pilot new module","due":"2025-10-01"}]}');
  const log=async()=>{ await fetch('/api/cs/qbr/log',{method:'POST',headers:{'Content-Type':'application/json'},body:a}); };
  const recent=async()=>{ const j=await (await fetch('/api/cs/qbr/recent?accountId=A-1')).json(); alert(JSON.stringify(j)); };
  return <section><h2>QBR Notes</h2>
    <textarea value={a} onChange={e=>setA(e.target.value)} style={{width:'100%',height:140}}/><div><button onClick={log}>Log</button><button onClick={recent} style={{marginLeft:8}}>Recent</button></div>
  </section>;
}
