import React, { useEffect, useState } from 'react';

export default function CONS_FX(){
  const [period,setPeriod]=useState(new Date().toISOString().slice(0,7)); const [rates,setRates]=useState('{"USD":1,"EUR":0.92,"JPY":155}');
  const [base,setBase]=useState('USD'); const [count,setCount]=useState<number>(0);
  const save=async()=>{ await fetch('/api/cons/fx/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({period,rates:JSON.parse(rates),cta_account:'CTA'})}); alert('Saved'); };
  const translate=async()=>{ const j=await (await fetch('/api/cons/fx/translate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({period,base})})).json(); setCount(j.count||0); };
  useEffect(()=>{},[]);
  return <section><h2>FX Rates & Translation</h2>
    <div><input value={period} onChange={e=>setPeriod(e.target.value)}/><input value={base} onChange={e=>setBase(e.target.value)} style={{marginLeft:8}}/><button onClick={save} style={{marginLeft:8}}>Save Rates</button><button onClick={translate} style={{marginLeft:8}}>Translate</button></div>
    <div style={{marginTop:8}}>Translated rows: {count}</div>
    <textarea value={rates} onChange={e=>setRates(e.target.value)} style={{width:'100%',height:120,marginTop:8}}/>
  </section>;
}
