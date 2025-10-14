import React, { useEffect, useState } from 'react';

export default function CLM_Obligations(){
  const [contractId,setContractId]=useState('C-1'); const [items,setItems]=useState('[{"id":"o1","title":"Uptime 99.9%","owner":"ops","due":"2025-12-31","category":"sla","status":"open"}]');
  const save=async()=>{ await fetch('/api/clm/obligations/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({contractId,items:JSON.parse(items)})}); };
  const renew=async()=>{ await fetch('/api/clm/renewals/set',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({contractId,renewal_date:'2026-09-01',auto:true,notice_days:60})}); };
  const upcoming=async()=>{ const j=await (await fetch('/api/clm/renewals/upcoming?window_days=400')).json(); alert(JSON.stringify(j)); };
  useEffect(()=>{},[]);
  return <section><h2>Obligations & Renewals</h2>
    <div><input value={contractId} onChange={e=>setContractId(e.target.value)}/><button onClick={save} style={{marginLeft:8}}>Save Obligations</button><button onClick={renew} style={{marginLeft:8}}>Set Renewal</button><button onClick={upcoming} style={{marginLeft:8}}>Upcoming</button></div>
    <textarea value={items} onChange={e=>setItems(e.target.value)} style={{width:'100%',height:120,marginTop:8}}/>
  </section>;
}
