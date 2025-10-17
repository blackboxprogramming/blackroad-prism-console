
import React, { useEffect, useState } from 'react';

export default function DEV_Webhooks(){
  const [reg,setReg]=useState('{"id":"wh-1","event":"invoice.created","url":"https://example.com/webhook","secret":"shh"}');
  const [deliver,setDeliver]=useState('{"event":"invoice.created","payload":{"id":"INV-1","amount":100}}');
  const [recent,setRecent]=useState<any>({});
  const register=async()=>{ await fetch('/api/dev/webhooks/register',{method:'POST',headers:{'Content-Type':'application/json'},body:reg}); };
  const send=async()=>{ await fetch('/api/dev/webhooks/deliver',{method:'POST',headers:{'Content-Type':'application/json'},body:deliver}); await load(); };
  const load=async()=>{ const j=await (await fetch('/api/dev/webhooks/recent?event=invoice.created')).json(); setRecent(j); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Webhooks</h2>
    <textarea value={reg} onChange={e=>setReg(e.target.value)} style={{width:'100%',height:100}}/><div><button onClick={register}>Register</button></div>
    <textarea value={deliver} onChange={e=>setDeliver(e.target.value)} style={{width:'100%',height:100,marginTop:8}}/><div><button onClick={send}>Deliver (Queue)</button><button onClick={load} style={{marginLeft:8}}>Recent</button></div>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(recent,null,2)}</pre>
  </section>;
}
