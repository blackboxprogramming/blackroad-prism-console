import React, { useEffect, useState } from 'react';

export default function CMDB_License(){
  const [ent,setEnt]=useState('{"product":"OfficeSuite","seats":25,"key":"XXXX-KEY"}'); const [use,setUse]=useState('{"product":"OfficeSuite","users":["u1","u2"],"hosts":["host-1"]}');
  const [product,setProduct]=useState('OfficeSuite'); const [view,setView]=useState<any>(null);
  const save=async()=>{ await fetch('/api/cmdb/license/entitlements/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:ent}); };
  const ingest=async()=>{ await fetch('/api/cmdb/license/usage/ingest',{method:'POST',headers:{'Content-Type':'application/json'},body:use}); };
  const status=async()=>{ const j=await (await fetch(`/api/cmdb/license/status?product=${product}`)).json(); setView(j); };
  useEffect(()=>{ status(); },[]);
  return <section><h2>License Compliance</h2>
    <textarea value={ent} onChange={e=>setEnt(e.target.value)} style={{width:'100%',height:120}}/><div><button onClick={save}>Save Entitlement</button></div>
    <textarea value={use} onChange={e=>setUse(e.target.value)} style={{width:'100%',height:100,marginTop:12}}/><div><button onClick={ingest}>Ingest Usage</button><input value={product} onChange={e=>setProduct(e.target.value)} style={{marginLeft:8}}/><button onClick={status} style={{marginLeft:8}}>Status</button></div>
    {view && <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(view,null,2)}</pre>}
  </section>;
}
