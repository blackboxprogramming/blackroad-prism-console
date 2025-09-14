import React, { useEffect, useState } from 'react';

export default function SUP_Channels_Routing(){
  const [ch,setCh]=useState({key:'inbox',type:'email',config:{address:'support@blackroad.io'}});
  const [rules,setRules]=useState('{"rules":[{"queue":"general","priority":"med","match":{"channel":"email"}}]}');
  const [list,setList]=useState<any>({});
  const reg=async()=>{ await fetch('/api/support/channels/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(ch)}); await load(); };
  const setR=async()=>{ await fetch('/api/support/routing/set',{method:'POST',headers:{'Content-Type':'application/json'},body:rules}); };
  const load=async()=>{ const j=await (await fetch('/api/support/channels/list')).json(); setList(j); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Channels & Routing</h2>
    <div><input value={ch.key} onChange={e=>setCh({...ch,key:e.target.value})}/><input value={ch.type} onChange={e=>setCh({...ch,type:e.target.value})} style={{marginLeft:8}}/><button onClick={reg} style={{marginLeft:8}}>Register</button></div>
    <textarea value={rules} onChange={e=>setRules(e.target.value)} style={{width:'100%',height:110,marginTop:8}}/><div><button onClick={setR}>Set Routing</button></div>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(list,null,2)}</pre>
  </section>;
}
