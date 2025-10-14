import React, { useEffect, useState } from 'react';

export default function CLM_Search(){
  const [q,setQ]=useState('liability'); const [labelKey,setLabelKey]=useState(''); const [view,setView]=useState<any>({});
  const index=async()=>{ const body={contractId:'C-1',text:'This Master Services Agreement sets a liability cap of 12 months fees.',labels:{counterparty:'Acme'}}; await fetch('/api/clm/repo/index',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}); };
  const search=async()=>{ const j=await (await fetch(`/api/clm/repo/search?q=${encodeURIComponent(q)}&label=${encodeURIComponent(labelKey)}`)).json(); setView(j); };
  useEffect(()=>{ search(); },[]);
  return <section><h2>Repository Search</h2>
    <div><input placeholder="q" value={q} onChange={e=>setQ(e.target.value)}/><input placeholder="label key" value={labelKey} onChange={e=>setLabelKey(e.target.value)} style={{marginLeft:8}}/><button onClick={index} style={{marginLeft:8}}>Index Sample</button><button onClick={search} style={{marginLeft:8}}>Search</button></div>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(view,null,2)}</pre>
  </section>;
}
