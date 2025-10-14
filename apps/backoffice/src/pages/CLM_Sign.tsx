import React, { useEffect, useState } from 'react';

export default function CLM_Sign(){
  const [contractId,setContractId]=useState('C-1'); const [view,setView]=useState<any>({});
  const send=async()=>{ const recipients=[{name:'Alice',email:'alice@example.com',role:'signer'},{name:'Bob',email:'bob@acme.com',role:'signer'}]; await fetch('/api/clm/esign/send',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({contractId,recipients})}); await status(); };
  const status=async()=>{ const j=await (await fetch(`/api/clm/esign/status/${contractId}`)).json(); setView(j); };
  useEffect(()=>{ status(); },[]);
  return <section><h2>e-Sign</h2>
    <div><input value={contractId} onChange={e=>setContractId(e.target.value)}/><button onClick={send} style={{marginLeft:8}}>Send</button><button onClick={status} style={{marginLeft:8}}>Status</button></div>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(view,null,2)}</pre>
  </section>;
}
