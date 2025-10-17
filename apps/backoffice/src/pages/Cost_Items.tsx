import React, { useEffect, useState } from 'react';

export default function Cost_Items(){
  const [sku,setSku]=useState('FG-100'); const [uom,setUom]=useState('ea'); const [method,setMethod]=useState('standard'); const [std,setStd]=useState(25); const [ovh,setOvh]=useState(0);
  const [view,setView]=useState<any>(null);
  const save=async()=>{ await fetch('/api/cost/items/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sku,uom,cost_method:method,std_cost:std,overhead_rate:ovh})}); await load(); };
  const load=async()=>{ const j=await (await fetch(`/api/cost/item/${sku}`)).json(); setView(j); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Item Cost Master</h2>
    <div><input value={sku} onChange={e=>setSku(e.target.value)}/><input value={uom} onChange={e=>setUom(e.target.value)} style={{marginLeft:8}}/>
      <select value={method} onChange={e=>setMethod(e.target.value)} style={{marginLeft:8}}><option>standard</option><option>fifo</option><option>average</option></select>
      <input type="number" value={std} onChange={e=>setStd(Number(e.target.value))} style={{marginLeft:8}}/><input type="number" value={ovh} onChange={e=>setOvh(Number(e.target.value))} style={{marginLeft:8}}/>
      <button onClick={save} style={{marginLeft:8}}>Save</button><button onClick={load} style={{marginLeft:8}}>Load</button></div>
    {view && <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(view,null,2)}</pre>}
  </section>;
}
