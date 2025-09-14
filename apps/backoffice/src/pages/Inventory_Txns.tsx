import React, { useState } from 'react';

export default function Inventory_Txns(){
  const [sku,setSku]=useState('FG-100'); const [loc,setLoc]=useState('MAIN');
  const post=async(type:string)=>{ const body={type,sku,qty:5,cost:25,from_loc:type==='transfer'?loc:'',to_loc:type==='transfer'?'SEC':'',ref:'test'}; await fetch('/api/inv/txn/post',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}); };
  const stock=async()=>{ const j=await (await fetch(`/api/inv/stock/${sku}?loc=${loc}`)).json(); alert(JSON.stringify(j)); };
  return <section><h2>Inventory Transactions</h2>
    <div><input value={sku} onChange={e=>setSku(e.target.value)}/><input value={loc} onChange={e=>setLoc(e.target.value)} style={{marginLeft:8}}/>
      <button onClick={()=>post('receipt')} style={{marginLeft:8}}>Receipt</button><button onClick={()=>post('issue')} style={{marginLeft:8}}>Issue</button><button onClick={()=>post('transfer')} style={{marginLeft:8}}>Transfer</button><button onClick={()=>post('adjust')} style={{marginLeft:8}}>Adjust</button><button onClick={stock} style={{marginLeft:8}}>Stock</button></div>
  </section>;
}
