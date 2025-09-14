import React, { useState } from 'react';

export default function Treasury_MarketRisk(){
  const [id,setId]=useState(''); const create=async()=>{ const positions=[{symbol:'SPY',qty:100,px:500,vol:0.2}]; const j=await (await fetch('/api/treasury/market/portfolio',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({positions,method:'param',cl:0.99,horizon_d:1})})).json(); setId(j.id); };
  const view=async()=>{ if(!id)return; const j=await (await fetch(`/api/treasury/market/var/${id}`)).json(); alert(JSON.stringify(j)); };
  return <section><h2>Market Risk (VaR/ES)</h2>
    <div><button onClick={create}>Create Portfolio</button><input placeholder="id" value={id} onChange={e=>setId(e.target.value)} style={{marginLeft:8}}/><button onClick={view} style={{marginLeft:8}}>Get VaR</button></div>
  </section>;
}
