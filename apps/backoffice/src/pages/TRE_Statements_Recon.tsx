import React, { useEffect, useState } from 'react';

export default function TRE_Statements_Recon(){
  const [ing,setIng]=useState({bankId:'citi',accountId:'op-usd',format:'CSV',period:new Date().toISOString().slice(0,7),lines:[{date:'2025-09-10',amount:10000,currency:'USD',description:'AR remittance',ref:'A1',type:'credit'},{date:'2025-09-11',amount:2500,currency:'USD',description:'AP payment',ref:'P1',type:'debit'}]});
  const [recon,setRecon]=useState({accountId:'op-usd',period:new Date().toISOString().slice(0,7)});
  const [recent,setRecent]=useState<any>({});
  const ingest=async()=>{ await fetch('/api/tre/statements/ingest',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(ing)}); await list(); };
  const match=async()=>{ const j=await (await fetch('/api/tre/recon/match',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(recon)})).json(); alert(JSON.stringify(j)); };
  const list=async()=>{ const j=await (await fetch(`/api/tre/statements/recent?accountId=op-usd&period=${ing.period}`)).json(); setRecent(j); };
  useEffect(()=>{ list(); },[]);
  return <section><h2>Statements & Reconciliation</h2>
    <div><button onClick={ingest}>Ingest</button><button onClick={match} style={{marginLeft:8}}>Match</button><button onClick={list} style={{marginLeft:8}}>Recent</button></div>
    <textarea value={JSON.stringify(ing,null,2)} onChange={e=>setIng(JSON.parse(e.target.value))} style={{width:'100%',height:160,marginTop:8}}/>
    <textarea value={JSON.stringify(recon,null,2)} onChange={e=>setRecon(JSON.parse(e.target.value))} style={{width:'100%',height:90,marginTop:8}}/>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(recent,null,2)}</pre>
  </section>;
}
