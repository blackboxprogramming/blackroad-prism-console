import React, { useEffect, useState } from 'react';

export default function CPM_Packs(){
  const [period,setPeriod]=useState(new Date().toISOString().slice(0,7)); const [audience,setAudience]=useState<'board'|'qbr'>('board'); const [latest,setLatest]=useState<string|null>(null);
  const make=async()=>{ const j=await (await fetch('/api/cpm/packs/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({period,audience})})).json(); alert(j.file); await load(); };
  const load=async()=>{ const j=await (await fetch('/api/cpm/packs/latest')).json(); setLatest(j.latest||null); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Board / QBR Packs</h2>
    <div><input value={period} onChange={e=>setPeriod(e.target.value)}/><select value={audience} onChange={e=>setAudience(e.target.value as any)} style={{marginLeft:8}}><option value="board">Board</option><option value="qbr">QBR</option></select><button onClick={make} style={{marginLeft:8}}>Generate</button></div>
    <div style={{marginTop:8}}>Latest: <code>{latest||'none'}</code></div>
  </section>;
}
