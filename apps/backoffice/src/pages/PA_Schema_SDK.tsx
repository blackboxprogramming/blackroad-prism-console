import React, { useEffect, useState } from 'react';

export default function PA_Schema_SDK(){
  const [schema,setSchema]=useState('{"events":[{"name":"App Launched","properties":{"platform":"string"}},{"name":"Signup","properties":{"plan":"string"}}]}');
  const [mint,setMint]=useState('{"app":"blackroad","platform":"web","env":"prod"}');
  const [view,setView]=useState<any>({}); const [keys,setKeys]=useState<any>({});
  const save=async()=>{ await fetch('/api/pa/events/schema/set',{method:'POST',headers:{'Content-Type':'application/json'},body:schema}); await load(); };
  const mintKey=async()=>{ const j=await (await fetch('/api/pa/sdk/keys/mint',{method:'POST',headers:{'Content-Type':'application/json'},body:mint})).json(); alert(j.write_key); await loadKeys(); };
  const load=async()=>{ const j=await (await fetch('/api/pa/events/schema')).json(); setView(j); };
  const loadKeys=async()=>{ const j=await (await fetch('/api/pa/sdk/keys')).json(); setKeys(j); };
  useEffect(()=>{ load(); loadKeys(); },[]);
  return <section><h2>PA: Schema & SDK Keys</h2>
    <div><button onClick={save}>Save Schema</button><button onClick={mintKey} style={{marginLeft:8}}>Mint Key</button></div>
    <textarea value={schema} onChange={e=>setSchema(e.target.value)} style={{width:'100%',height:150,marginTop:8}}/>
    <textarea value={mint} onChange={e=>setMint(e.target.value)} style={{width:'100%',height:100,marginTop:8}}/>
    <h4>Schema</h4><pre style={{background:'#f7f7f7',padding:8}}>{JSON.stringify(view,null,2)}</pre>
    <h4>Keys</h4><pre style={{background:'#f7f7f7',padding:8}}>{JSON.stringify(keys,null,2)}</pre>
  </section>;
}
