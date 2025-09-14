import React, { useEffect, useState } from 'react';

export default function Tax_Nexus(){
  const [form,setForm]=useState({jurisdiction:'US-CA',type:'economic',start:new Date().toISOString().slice(0,10),threshold:'$100k/200 tx',notes:''});
  const [list,setList]=useState<any[]>([]);
  const upsert=async()=>{ await fetch('/api/tax/nexus/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)}); await load(); };
  const load=async()=>{ const j=await (await fetch('/api/tax/nexus/list')).json(); setList(j||[]); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Nexus & Registration</h2>
    <div>
      <input value={form.jurisdiction} onChange={e=>setForm({...form,jurisdiction:e.target.value})}/>
      <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})} style={{marginLeft:8}}><option>economic</option><option>physical</option></select>
      <input value={form.start} onChange={e=>setForm({...form,start:e.target.value})} style={{marginLeft:8}}/>
      <input value={form.threshold} onChange={e=>setForm({...form,threshold:e.target.value})} style={{marginLeft:8}}/>
      <input value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} style={{marginLeft:8,width:240}}/>
      <button onClick={upsert} style={{marginLeft:8}}>Save</button>
    </div>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(list,null,2)}</pre>
  </section>;
}
