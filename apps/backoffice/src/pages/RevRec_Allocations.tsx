import React, { useState } from 'react';

export default function RevRec_Allocations(){
  const [contractId,setContractId]=useState('C-1001'); const alloc=async()=>{ const j=await (await fetch('/api/revrec/allocate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({contractId})})).json(); alert(JSON.stringify(j)); };
  const view=async()=>{ const j=await (await fetch(`/api/revrec/allocations/${contractId}`)).json(); alert(JSON.stringify(j)); };
  return <section><h2>Allocations</h2>
    <div><input value={contractId} onChange={e=>setContractId(e.target.value)}/><button onClick={alloc} style={{marginLeft:8}}>Allocate</button><button onClick={view} style={{marginLeft:8}}>View</button></div>
  </section>;
}
