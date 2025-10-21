import React, { useEffect, useState } from 'react';

export default function SOC_Detections(){
  const [yaml,setYaml]=useState('id: T-0001\ntitle: Example\nlogsource: app\ndetection: {}\nseverity: medium\ntags: [test]');
  const [items,setItems]=useState<string[]>([]);
  const upsert=async()=>{ await fetch('/api/soc/detections/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({yaml})}); await load(); };
  const load=async()=>{ const j=await (await fetch('/api/soc/detections/list')).json(); setItems(j.items||[]); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Detections</h2>
    <textarea value={yaml} onChange={e=>setYaml(e.target.value)} style={{width:'100%',height:120}}/>
    <div><button onClick={upsert} style={{marginTop:8}}>Upsert</button></div>
    <ul style={{marginTop:8}}>{items.map(i=><li key={i}>{i}</li>)}</ul>
  </section>;
}
