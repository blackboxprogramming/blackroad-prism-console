import React, { useEffect, useState } from 'react';

export default function IAM_Tokens(){
  const [body,setBody]=useState('{"subject":"u1","audience":"api","scope":["read","write"],"ttl_s":900}');
  const [recent,setRecent]=useState<any>({});
  const mint=async()=>{ const j=await (await fetch('/api/iam/tokens/mint',{method:'POST',headers:{'Content-Type':'application/json'},body})).json(); alert(JSON.stringify(j)); await load(); };
  const load=async()=>{ const j=await (await fetch('/api/iam/tokens/recent')).json(); setRecent(j); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>JIT Tokens</h2>
    <textarea value={body} onChange={e=>setBody(e.target.value)} style={{width:'100%',height:120}}/>
    <div><button onClick={mint}>Mint</button><button onClick={load} style={{marginLeft:8}}>Recent</button></div>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(recent,null,2)}</pre>
  </section>;
}
