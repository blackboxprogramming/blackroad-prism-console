import React from 'react';

export default function Treasury_ALM(){
  const schedule=async(side:'asset'|'liability')=>{ const items=[{amount:1000000,rate:0.05,repricing_days:90}]; await fetch('/api/treasury/alm/schedule',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({side,items})}); alert('Saved'); };
  const gap=async()=>{ const j=await (await fetch('/api/treasury/alm/gap')).json(); alert(JSON.stringify(j)); };
  return <section><h2>ALM</h2>
    <div><button onClick={()=>schedule('asset')}>Set Assets</button><button onClick={()=>schedule('liability')} style={{marginLeft:8}}>Set Liabilities</button><button onClick={gap} style={{marginLeft:8}}>Gap</button></div>
  </section>;
}
