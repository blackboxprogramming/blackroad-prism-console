import React, { useEffect, useState } from 'react';

export default function MDM_Stage(){
  const [domain,setDomain]=useState('accounts'); const [source,setSource]=useState('CRM'); const [source_id,setSourceId]=useState('A-1');
  const [record,setRecord]=useState('{"name":"ACME","domain":"acme.com"}'); const [items,setItems]=useState<any>({});
  const upsert=async()=>{ await fetch('/api/mdm/stage/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({domain,source,source_id,record:JSON.parse(record)})}); await load(); };
  const load=async()=>{ const j=await (await fetch(`/api/mdm/stage/recent?domain=${domain}&source=${source}`)).json(); setItems(j); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Staging Ingest</h2>
    <div><input value={domain} onChange={e=>setDomain(e.target.value)}/><input value={source} onChange={e=>setSource(e.target.value)} style={{marginLeft:8}}/><input value={source_id} onChange={e=>setSourceId(e.target.value)} style={{marginLeft:8}}/><button onClick={upsert} style={{marginLeft:8}}>Upsert</button><button onClick={load} style={{marginLeft:8}}>Recent</button></div>
    <textarea value={record} onChange={e=>setRecord(e.target.value)} style={{width:'100%',height:120,marginTop:8}}/>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(items,null,2)}</pre>
  </section>;
}
