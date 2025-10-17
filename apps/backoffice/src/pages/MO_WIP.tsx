import React, { useState } from 'react';

export default function MO_WIP(){
  const [moId,setMoId]=useState('MO-1'); const [sku,setSku]=useState('FG-100'); const [qty,setQty]=useState(10);
  const create=async()=>{ await fetch('/api/cost/mo/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({moId,sku,qty,start:new Date().toISOString().slice(0,10)})}); };
  const complete=async()=>{ await fetch('/api/cost/mo/complete',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({moId,qty_good:qty,qty_scrap:0,date:new Date().toISOString().slice(0,10)})}); };
  const view=async()=>{ const j=await (await fetch(`/api/cost/mo/${moId}`)).json(); alert(JSON.stringify(j)); };
  return <section><h2>WIP / Manufacturing Orders</h2>
    <div><input value={moId} onChange={e=>setMoId(e.target.value)}/><input value={sku} onChange={e=>setSku(e.target.value)} style={{marginLeft:8}}/><input type="number" value={qty} onChange={e=>setQty(Number(e.target.value))} style={{marginLeft:8}}/>
      <button onClick={create} style={{marginLeft:8}}>Create</button><button onClick={complete} style={{marginLeft:8}}>Complete</button><button onClick={view} style={{marginLeft:8}}>View</button></div>
  </section>;
}
