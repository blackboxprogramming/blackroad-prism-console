import React, { useEffect, useState } from 'react';

export default function Tax_Jurisdictions(){
  const [form,setForm]=useState({code:'US-CA',name:'California',country:'US',region:'CA',rate:0.0725,effective:new Date().toISOString().slice(0,10)});
  const [list,setList]=useState<any[]>([]);
  const upsert=async()=>{ await fetch('/api/tax/jurisdictions/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)}); await load(); };
  const load=async()=>{ const j=await (await fetch('/api/tax/jurisdictions/list')).json(); setList(j||[]); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Jurisdictions</h2>
    <div>
      <input value={form.code} onChange={e=>setForm({...form,code:e.target.value})}/>
      <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} style={{marginLeft:8}}/>
      <input value={form.country} onChange={e=>setForm({...form,country:e.target.value})} style={{marginLeft:8}}/>
      <input value={form.region} onChange={e=>setForm({...form,region:e.target.value})} style={{marginLeft:8}}/>
      <input type="number" step="0.0001" value={form.rate} onChange={e=>setForm({...form,rate:Number(e.target.value)})} style={{marginLeft:8}}/>
      <input value={form.effective} onChange={e=>setForm({...form,effective:e.target.value})} style={{marginLeft:8}}/>
      <button onClick={upsert} style={{marginLeft:8}}>Save</button>
    </div>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(list,null,2)}</pre>
  </section>;
}
