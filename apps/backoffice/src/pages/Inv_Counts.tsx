import React, { useEffect, useState } from 'react';

export default function Inv_Counts(){
  const [countId,setCountId]=useState('COUNT-1'); const [loc,setLoc]=useState('MAIN'); const [skus,setSkus]=useState('["FG-100","ITM-1"]'); const [view,setView]=useState<any>(null);
  const start=async()=>{ await fetch('/api/inv/count/start',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({countId,loc,skus:JSON.parse(skus)})}); };
  const submit=async()=>{ const lines=[{sku:'FG-100',qty_counted:9},{sku:'ITM-1',qty_counted:4}]; await fetch('/api/inv/count/submit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({countId,lines})}); };
  const adjust=async()=>{ await fetch('/api/inv/count/adjust',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({countId})}); };
  const load=async()=>{ const j=await (await fetch(`/api/inv/count/${countId}`)).json(); setView(j); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Physical Count</h2>
    <div><input value={countId} onChange={e=>setCountId(e.target.value)}/><input value={loc} onChange={e=>setLoc(e.target.value)} style={{marginLeft:8}}/><input value={skus} onChange={e=>setSkus(e.target.value)} style={{marginLeft:8,width:300}}/>
      <button onClick={start} style={{marginLeft:8}}>Start</button><button onClick={submit} style={{marginLeft:8}}>Submit</button><button onClick={adjust} style={{marginLeft:8}}>Adjust</button><button onClick={load} style={{marginLeft:8}}>Load</button></div>
    {view && <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(view,null,2)}</pre>}
  </section>;
}
