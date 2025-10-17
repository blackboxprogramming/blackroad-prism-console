import React, { useEffect, useState } from 'react';

export default function Cost_Variance(){
  const [period,setPeriod]=useState(new Date().toISOString().slice(0,7)); const [items,setItems]=useState<any[]>([]);
  const calc=async()=>{ await fetch('/api/cost/variance/calc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({period})}); await load(); };
  const load=async()=>{ const j=await (await fetch(`/api/cost/variance/recent?period=${period}`)).json(); setItems(j.items||[]); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>PPV / Usage Variance</h2>
    <div><input value={period} onChange={e=>setPeriod(e.target.value)}/><button onClick={calc} style={{marginLeft:8}}>Calc</button><button onClick={load} style={{marginLeft:8}}>Refresh</button></div>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(items,null,2)}</pre>
  </section>;
}
