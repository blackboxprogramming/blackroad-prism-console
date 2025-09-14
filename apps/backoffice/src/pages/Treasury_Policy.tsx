import React from 'react';

export default function Treasury_Policy(){
  const setPol=async()=>{ const json={limits:{var_pct:0.05,counterparty_max:2000000}}; await fetch('/api/treasury/policy/set',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({json})}); alert('Saved'); };
  const evalPol=async()=>{ const j=await (await fetch('/api/treasury/policy/evaluate',{method:'POST'})).json(); alert(JSON.stringify(j)); };
  return <section><h2>Treasury Policy</h2>
    <div><button onClick={setPol}>Set Policy</button><button onClick={evalPol} style={{marginLeft:8}}>Evaluate</button></div>
  </section>;
}
