import React, { useEffect, useState } from 'react';

export default function RevRec_Packs(){
  const [period,setPeriod]=useState(new Date().toISOString().slice(0,7).replace('-',''));
  const [latest,setLatest]=useState<string|null>(null);
  const make=async()=>{ const j=await (await fetch('/api/revrec/pack/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({period})})).json(); alert(j.file); await load(); };
  const load=async()=>{ const j=await (await fetch('/api/revrec/pack/latest')).json(); setLatest(j.latest||null); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Audit Pack</h2>
    <div><input value={period} onChange={e=>setPeriod(e.target.value)}/><button onClick={make} style={{marginLeft:8}}>Generate</button></div>
    <div style={{marginTop:8}}>Latest: <code>{latest||'none'}</code></div>
  </section>;
}
