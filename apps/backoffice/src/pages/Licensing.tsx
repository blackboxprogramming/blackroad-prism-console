import React, { useState } from 'react';

export default function Licensing(){
  const [product,setProduct]=useState('blackroad-pro');
  const [plan,setPlan]=useState('PRO');
  const [seats,setSeats]=useState(10);
  const [usage,setUsage]=useState<any>(null);
  const planSet = async ()=> {
    await fetch('/api/admin/licenses/plan',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({product,plan,seats})});
  };
  const assign = async ()=> {
    const userId = prompt('User ID?') || '';
    await fetch('/api/admin/licenses/assign',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({product,userId})});
  };
  const check = async ()=> {
    const j = await (await fetch(`/api/admin/licenses/usage?product=${encodeURIComponent(product)}`)).json();
    setUsage(j);
  };
  return <section>
    <h2>Licensing</h2>
    <div>
      <input value={product} onChange={e=>setProduct(e.target.value)} />
      <input value={plan} onChange={e=>setPlan(e.target.value)} style={{marginLeft:8}} />
      <input type="number" value={seats} onChange={e=>setSeats(Number(e.target.value))} style={{marginLeft:8}} />
      <button onClick={planSet} style={{marginLeft:8}}>Set Plan</button>
      <button onClick={assign} style={{marginLeft:8}}>Assign Seat</button>
      <button onClick={check} style={{marginLeft:8}}>Usage</button>
    </div>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{usage?JSON.stringify(usage,null,2):''}</pre>
  </section>;
}
