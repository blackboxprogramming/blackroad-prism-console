import React, { useState } from 'react';

export default function Leases_Schedules(){
  const [leaseId,setLeaseId]=useState('L-100');
  const build=async()=>{ const j=await (await fetch('/api/leases/schedule/build',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({leaseId})})).json(); alert(JSON.stringify(j)); };
  const view=async()=>{ const j=await (await fetch(`/api/leases/schedule/${leaseId}`)).json(); alert(JSON.stringify(j)); };
  return <section><h2>Lease Schedules</h2>
    <div><input value={leaseId} onChange={e=>setLeaseId(e.target.value)}/><button onClick={build} style={{marginLeft:8}}>Build</button><button onClick={view} style={{marginLeft:8}}>View</button></div>
  </section>;
}
