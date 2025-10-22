import React from 'react';

export default function Treasury_Credit(){
  const upsert=async()=>{ const exposures=[{id:'acct1',EAD:100000,PD:0.02,LGD:0.45}]; await fetch('/api/treasury/credit/portfolio',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({exposures})}); alert('Saved'); };
  const view=async()=>{ const j=await (await fetch('/api/treasury/credit/snapshot')).json(); alert(JSON.stringify(j)); };
  return <section><h2>Credit Risk</h2>
    <div><button onClick={upsert}>Upsert Portfolio</button><button onClick={view} style={{marginLeft:8}}>Snapshot</button></div>
  </section>;
}
