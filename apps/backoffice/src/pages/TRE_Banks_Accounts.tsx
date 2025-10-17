import React, { useEffect, useState } from 'react';

export default function TRE_Banks_Accounts(){
  const [bank,setBank]=useState({bankId:'citi',name:'Citi',country:'US',swift:'CITIUS33'});
  const [acct,setAcct]=useState({accountId:'op-usd',bankId:'citi',entity:'US-CO',currency:'USD',number:'123456789',routing:'026009593',purpose:'operating'});
  const [bv,setBv]=useState<any>(null); const [av,setAv]=useState<any>(null);
  const saveB=async()=>{ await fetch('/api/tre/banks/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(bank)}); await loadB(); };
  const saveA=async()=>{ await fetch('/api/tre/accounts/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(acct)}); await loadA(); };
  const loadB=async()=>{ const j=await (await fetch(`/api/tre/banks/${bank.bankId}`)).json(); setBv(j); };
  const loadA=async()=>{ const j=await (await fetch(`/api/tre/accounts/${acct.accountId}`)).json(); setAv(j); };
  useEffect(()=>{ loadB(); loadA(); },[]);
  return <section><h2>Banks & Accounts</h2>
    <div><button onClick={saveB}>Save Bank</button><button onClick={saveA} style={{marginLeft:8}}>Save Account</button></div>
    <textarea value={JSON.stringify(bank,null,2)} onChange={e=>setBank(JSON.parse(e.target.value))} style={{width:'100%',height:120,marginTop:8}}/>
    <textarea value={JSON.stringify(acct,null,2)} onChange={e=>setAcct(JSON.parse(e.target.value))} style={{width:'100%',height:120,marginTop:8}}/>
    {bv && <pre style={{background:'#f7f7f7',padding:8,marginTop:8}}>{JSON.stringify(bv,null,2)}</pre>}
    {av && <pre style={{background:'#f7f7f7',padding:8,marginTop:8}}>{JSON.stringify(av,null,2)}</pre>}
  </section>;
}
