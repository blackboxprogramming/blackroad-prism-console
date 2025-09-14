import React, { useEffect, useState } from 'react';

export default function Treasury_Hedges(){
  const [list,setList]=useState<any[]>([]);
  const upsert=async()=>{ const id=prompt('Hedge ID?')||''; const type=(prompt('Type (FX|IR)?','FX')||'FX') as 'FX'|'IR'; const notional=Number(prompt('Notional?','1000000')||'0'); await fetch('/api/treasury/hedges/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,type,notional,tenor_d:180,ccy_pair:'EURUSD',rate:1.1,counterparty:'BankA'})}); await load(); };
  const load=async()=>{ const j=await (await fetch('/api/treasury/hedges/list')).json(); setList(j||[]); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Hedges</h2>
    <div><button onClick={upsert}>Upsert Hedge</button><button onClick={load} style={{marginLeft:8}}>Refresh</button></div>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(list,null,2)}</pre>
  </section>;
}
