import React from 'react';

export default function Tax_FATCA(){
  const add=async()=>{ const payeeId=prompt('Payee ID?')||''; const giin=prompt('GIIN?')||''; await fetch('/api/tax/fatca/profile',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({payeeId,giin,indicia:{},documentation:{},status:'review'})}); alert('Saved'); };
  const view=async()=>{ const j=await (await fetch('/api/tax/fatca/review?year=2025')).json(); alert(JSON.stringify(j)); };
  return <section><h2>FATCA/CRS</h2>
    <div><button onClick={add}>Save Profile</button><button onClick={view} style={{marginLeft:8}}>Review</button></div>
  </section>;
}
