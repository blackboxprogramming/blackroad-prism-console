import React, { useEffect, useState } from 'react';

export default function Contracts(){
  const [items,setItems]=useState<any[]>([]);
  const refresh=async()=>{ const j=await (await fetch('/api/clm/contracts/list')).json(); setItems(j.items||[]); };
  const route=async(id:string)=>{ await fetch('/api/clm/approvals/route',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})}); await refresh(); };
  const sign=async(id:string)=>{ await fetch('/api/clm/contracts/state',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,state:'Approved'})}); await refresh(); };
  useEffect(()=>{ refresh(); },[]);
  return <section><h2>Contracts</h2><button onClick={refresh}>Refresh</button>
    <table border={1} cellPadding={6} style={{marginTop:8}}>
      <thead><tr><th>Title</th><th>Type</th><th>State</th><th>Amount</th><th>Renewal</th><th>Actions</th></tr></thead>
      <tbody>{items.map(c=><tr key={c.id}><td>{c.title}</td><td>{c.type}</td><td>{c.state}</td><td>{c.amount}</td><td>{c.renewalDate||''}</td>
        <td><button onClick={()=>route(c.id)}>Route</button><button style={{marginLeft:6}} onClick={()=>sign(c.id)}>Approve</button></td></tr>)}</tbody>
    </table>
  </section>;
}
