import React, { useEffect, useState } from 'react';

export default function PORTAL_Channels_Sends(){
  const [reg,setReg]=useState({key:'email-default',type:'email',config:{from:'noreply@blackroad.io'}});
  const [send,setSend]=useState({channel:'email',to:'user@example.com',template_md:'# Hello',ref:{type:'announcement',id:'ann-1'}});
  const [recent,setRecent]=useState<any>({});
  const register=async()=>{ await fetch('/api/portal/channels/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(reg)}); };
  const notify=async()=>{ const j=await (await fetch('/api/portal/notify/send',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(send)})).json(); alert(JSON.stringify(j)); await load(); };
  const load=async()=>{ const j=await (await fetch('/api/portal/sends/recent?channel=email')).json(); setRecent(j); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Channels & Sends</h2>
    <div><button onClick={register}>Register</button><button onClick={notify} style={{marginLeft:8}}>Notify</button><button onClick={load} style={{marginLeft:8}}>Recent</button></div>
    <textarea value={JSON.stringify(reg,null,2)} onChange={e=>setReg(JSON.parse(e.target.value))} style={{width:'100%',height:110,marginTop:8}}/>
    <textarea value={JSON.stringify(send,null,2)} onChange={e=>setSend(JSON.parse(e.target.value))} style={{width:'100%',height:110,marginTop:8}}/>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(recent,null,2)}</pre>
  </section>;
}
