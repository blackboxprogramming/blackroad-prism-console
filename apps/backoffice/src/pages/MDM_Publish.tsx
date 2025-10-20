import React, { useEffect, useState } from 'react';

export default function MDM_Publish(){
  const [domain,setDomain]=useState('accounts'); const [items,setItems]=useState<any>({});
  const pub=async()=>{ await fetch('/api/mdm/publish/changes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({domain})}); await recent(); };
  const recent=async()=>{ const j=await (await fetch(`/api/mdm/publish/recent?domain=${domain}`)).json(); setItems(j); };
  useEffect(()=>{ recent(); },[]);
  return <section><h2>CDC Publish</h2>
    <div><input value={domain} onChange={e=>setDomain(e.target.value)}/><button onClick={pub} style={{marginLeft:8}}>Publish</button><button onClick={recent} style={{marginLeft:8}}>Recent</button></div>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(items,null,2)}</pre>
  </section>;
}
