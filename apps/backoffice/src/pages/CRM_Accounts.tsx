
import React, { useEffect, useState } from 'react';

export default function CRM_Accounts(){
  const [a,setA]=useState({id:'A-1',name:'ACME',domain:'acme.com',industry:'Tech',region:'NA',owner:'rep1'});
  const save=async()=>{ await fetch('/api/crm/accounts/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(a)}); };
  const [c,setC]=useState({id:'C-1',accountId:'A-1',name:'Ada Lovelace',email:'ada@acme.com',title:'CTO'});
  const saveC=async()=>{ await fetch('/api/crm/contacts/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(c)}); };
  useEffect(()=>{},[]);
  return <section><h2>Accounts & Contacts</h2>
    <div><input value={a.id} onChange={e=>setA({...a,id:e.target.value})}/><input value={a.name} onChange={e=>setA({...a,name:e.target.value})} style={{marginLeft:8}}/><input value={a.domain} onChange={e=>setA({...a,domain:e.target.value})} style={{marginLeft:8}}/><button onClick={save} style={{marginLeft:8}}>Save Account</button></div>
    <div style={{marginTop:8}}><input value={c.id} onChange={e=>setC({...c,id:e.target.value})}/><input value={c.accountId} onChange={e=>setC({...c,accountId:e.target.value})} style={{marginLeft:8}}/><input value={c.name} onChange={e=>setC({...c,name:e.target.value})} style={{marginLeft:8}}/><input value={c.email} onChange={e=>setC({...c,email:e.target.value})} style={{marginLeft:8}}/><button onClick={saveC} style={{marginLeft:8}}>Save Contact</button></div>
  </section>;
}

