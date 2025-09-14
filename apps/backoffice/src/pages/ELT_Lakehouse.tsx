import React, { useEffect, useState } from 'react';

export default function ELT_Lakehouse(){
  const [tbl,setTbl]=useState({db:'silver',table:'contacts',layer:'silver',schema:{fields:['id','email','country']},owner:'data',quality:{tested:true,expectations:['email_not_null','country_valid']}});
  const [view,setView]=useState<any>({});
  const upsert=async()=>{ await fetch('/api/elt/lakehouse/tables/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(tbl)}); await load(); };
  const load=async()=>{ const j=await (await fetch(`/api/elt/lakehouse/tables/${tbl.db}/${tbl.table}`)).json(); setView(j); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Lakehouse Tables</h2>
    <div><input value={tbl.db} onChange={e=>setTbl({...tbl,db:e.target.value})}/><input value={tbl.table} onChange={e=>setTbl({...tbl,table:e.target.value})} style={{marginLeft:8}}/><button onClick={upsert} style={{marginLeft:8}}>Upsert</button><button onClick={load} style={{marginLeft:8}}>Load</button></div>
    <textarea value={JSON.stringify(tbl,null,2)} onChange={e=>setTbl(JSON.parse(e.target.value))} style={{width:'100%',height:160,marginTop:8}}/>
    {view && <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(view,null,2)}</pre>}
  </section>;
}
