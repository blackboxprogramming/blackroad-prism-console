import React, { useState } from 'react';

export default function RevRec_Schedules(){
  const [contractId,setContractId]=useState('C-1001');
  const build=async()=>{ const j=await (await fetch('/api/revrec/schedule/build',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({contractId})})).json(); alert(JSON.stringify(j)); };
  const view=async()=>{ const j=await (await fetch(`/api/revrec/schedule/${contractId}`)).json(); alert(JSON.stringify(j)); };
  return <section><h2>Schedules</h2>
    <div><input value={contractId} onChange={e=>setContractId(e.target.value)}/><button onClick={build} style={{marginLeft:8}}>Build</button><button onClick={view} style={{marginLeft:8}}>View</button></div>
  </section>;
}
