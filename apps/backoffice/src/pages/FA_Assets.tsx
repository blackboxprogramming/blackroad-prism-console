import React, { useEffect, useState } from 'react';

export default function FA_Assets(){
  const [f,setF]=useState({assetId:'FA-100',description:'Server',category:'IT',acquire_date:'2025-01-01',cost:12000,currency:'USD',life_months:36,method:'SL',salvage:0,loc:'HQ'});
  const [view,setView]=useState<any>(null);
  const create=async()=>{ await fetch('/api/fa/assets/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(f)}); await load(); };
  const state=async()=>{ const s=prompt('state (active|disposed|transferred|impaired)','active')||'active'; await fetch('/api/fa/assets/state',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({assetId:f.assetId,state:s})}); await load(); };
  const transfer=async()=>{ await fetch('/api/fa/transfer',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({assetId:f.assetId,from_loc:'HQ',to_loc:'DC',date:new Date().toISOString().slice(0,10)})}); };
  const impair=async()=>{ await fetch('/api/fa/impair',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({assetId:f.assetId,amount:500,reason:'obsolete',date:new Date().toISOString().slice(0,10)})}); };
  const load=async()=>{ const j=await (await fetch(`/api/fa/assets/${f.assetId}`)).json(); setView(j); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Fixed Assets</h2>
    <div><input value={f.assetId} onChange={e=>setF({...f,assetId:e.target.value})}/><input value={f.description} onChange={e=>setF({...f,description:e.target.value})} style={{marginLeft:8}}/><input value={f.category} onChange={e=>setF({...f,category:e.target.value})} style={{marginLeft:8}}/><input value={f.acquire_date} onChange={e=>setF({...f,acquire_date:e.target.value})} style={{marginLeft:8}}/>
      <input type="number" value={f.cost} onChange={e=>setF({...f,cost:Number(e.target.value)})} style={{marginLeft:8,width:110}}/><input value={f.currency} onChange={e=>setF({...f,currency:e.target.value})} style={{marginLeft:8,width:80}}/><input type="number" value={f.life_months} onChange={e=>setF({...f,life_months:Number(e.target.value)})} style={{marginLeft:8,width:90}}/><select value={f.method} onChange={e=>setF({...f,method:e.target.value})} style={{marginLeft:8}}><option>SL</option><option>DDB</option><option>SYD</option></select>
      <input type="number" value={f.salvage} onChange={e=>setF({...f,salvage:Number(e.target.value)})} style={{marginLeft:8,width:90}}/><input value={f.loc} onChange={e=>setF({...f,loc:e.target.value})} style={{marginLeft:8,width:90}}/>
      <button onClick={create} style={{marginLeft:8}}>Create</button><button onClick={state} style={{marginLeft:8}}>State</button><button onClick={transfer} style={{marginLeft:8}}>Transfer</button><button onClick={impair} style={{marginLeft:8}}>Impair</button></div>
    {view && <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(view,null,2)}</pre>}
  </section>;
}
