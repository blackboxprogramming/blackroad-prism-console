import React, { useEffect, useState } from 'react';

export default function ESG_SupplierEthics(){
  const [items,setItems]=useState<any[]>([]);
  const [vendorId,setVendorId]=useState(''); const [standard,setStandard]=useState('SA8000'); const [score,setScore]=useState(80); const [findings,setFindings]=useState('["no issues"]');
  const add=async()=>{ await fetch('/api/esg/ethics/audit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({vendorId,standard,score,findings:JSON.parse(findings)})}); await load(); };
  const load=async()=>{ const qs=vendorId?`?vendorId=${encodeURIComponent(vendorId)}`:''; const j=await (await fetch(`/api/esg/ethics/recent${qs}`)).json(); setItems(j.items||[]); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Supplier Ethics</h2>
    <div><input placeholder="Vendor ID" value={vendorId} onChange={e=>setVendorId(e.target.value)}/><input placeholder="Standard" value={standard} onChange={e=>setStandard(e.target.value)} style={{marginLeft:8}}/><input type="number" value={score} onChange={e=>setScore(Number(e.target.value))} style={{marginLeft:8}}/><input value={findings} onChange={e=>setFindings(e.target.value)} style={{marginLeft:8,width:300}}/><button onClick={add} style={{marginLeft:8}}>Add</button><button onClick={load} style={{marginLeft:8}}>Refresh</button></div>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(items,null,2)}</pre>
  </section>;
}
