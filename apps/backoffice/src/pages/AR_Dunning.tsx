import React, { useEffect, useState } from 'react';

export default function AR_Dunning(){
  const [items,setItems]=useState<any[]>([]);
  const run=async()=>{ await fetch('/api/ar/dunning/run',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({asof:new Date().toISOString().slice(0,10)})}); await load(); };
  const load=async()=>{ const j=await (await fetch('/api/ar/dunning/recent')).json(); setItems(j.items||[]); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Dunning</h2>
    <div><button onClick={run}>Run</button><button onClick={load} style={{marginLeft:8}}>Refresh</button></div>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(items,null,2)}</pre>
  </section>;
}
