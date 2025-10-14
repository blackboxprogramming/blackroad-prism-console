import React, { useEffect, useState } from 'react';

export default function CLM_Templates(){
  const [tpl,setTpl]=useState({key:'msa',type:'MSA',md:'# MSA\\nTerms...',clauses:['liability','confidentiality']});
  const [view,setView]=useState<any>(null);
  const save=async()=>{ await fetch('/api/clm/templates/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(tpl)}); await load(); };
  const load=async()=>{ const j=await (await fetch(`/api/clm/templates/${tpl.key}`)).json(); setView(j); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Templates</h2>
    <div><input value={tpl.key} onChange={e=>setTpl({...tpl,key:e.target.value})}/><select value={tpl.type} onChange={e=>setTpl({...tpl,type:e.target.value})} style={{marginLeft:8}}><option>MSA</option><option>NDA</option><option>OrderForm</option><option>SOW</option><option>DPA</option><option>Custom</option></select><button onClick={save} style={{marginLeft:8}}>Save</button></div>
    <textarea value={tpl.md} onChange={e=>setTpl({...tpl,md:e.target.value})} style={{width:'100%',height:140,marginTop:8}}/>
    {view && <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(view,null,2)}</pre>}
  </section>;
}
