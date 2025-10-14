import React, { useEffect, useState } from 'react';

export default function CPQ_Rules(){
  const [yaml,setYaml]=useState('rules:\\n  promo_percent:\\n    percent: 10');
  const [yaml,setYaml]=useState('rules:\n  promo_percent:\n    percent: 10');
  const [list,setList]=useState<any>({});
  const save=async()=>{ await fetch('/api/cpq/pricing/rule',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:'promo_percent',yaml})}); await load(); };
  const load=async()=>{ const j=await (await fetch('/api/cpq/pricing/rules')).json(); setList(j||{}); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Pricing Rules</h2>
    <textarea value={yaml} onChange={e=>setYaml(e.target.value)} style={{width:'100%',height:180}}/>
    <div><button onClick={save} style={{marginTop:8}}>Save Rule</button></div>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:8}}>{JSON.stringify(list,null,2)}</pre>
  </section>;
}
