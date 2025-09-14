import React, { useEffect, useState } from 'react';

export default function AR_Credit(){
  const [customerId,setCustomerId]=useState('CUST-1'); const [view,setView]=useState<any>(null);
  const setC=async()=>{ await fetch('/api/ar/credit/set',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({customerId,limit:20000,terms:'NET30',hold:false})}); await load(); };
  const load=async()=>{ const j=await (await fetch(`/api/ar/credit/${customerId}`)).json(); setView(j); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Credit & Terms</h2>
    <div><input value={customerId} onChange={e=>setCustomerId(e.target.value)}/><button onClick={setC} style={{marginLeft:8}}>Set</button><button onClick={load} style={{marginLeft:8}}>Load</button></div>
    {view && <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(view,null,2)}</pre>}
  </section>;
}
