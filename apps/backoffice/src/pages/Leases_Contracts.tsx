import React, { useState } from 'react';

export default function Leases_Contracts(){
  const [leaseId,setLeaseId]=useState('L-100');
  const create=async()=>{ const body={leaseId,lessee:'BlackRoad',lessor:'LandlordCo',start:'2025-01-01',end:'2027-12-31',rate:0.05,type:'operating',currency:'USD',payments:[{date:'2025-01-01',amount:1000},{date:'2025-02-01',amount:1000}]}; await fetch('/api/leases/contract/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}); };
  const view=async()=>{ const j=await (await fetch(`/api/leases/contract/${leaseId}`)).json(); alert(JSON.stringify(j)); };
  return <section><h2>Lease Contracts</h2>
    <div><input value={leaseId} onChange={e=>setLeaseId(e.target.value)}/><button onClick={create} style={{marginLeft:8}}>Create</button><button onClick={view} style={{marginLeft:8}}>View</button></div>
  </section>;
}
