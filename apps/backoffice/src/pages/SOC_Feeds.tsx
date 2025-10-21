import React, { useEffect, useState } from 'react';

export default function SOC_Feeds(){
  const [key,setKey]=useState('abuseipdb'); const [url,setUrl]=useState('https://threat.example.com/feed.json'); const [list,setList]=useState<any>({});
  const upsert=async()=>{ await fetch('/api/soc/feeds/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key,url})}); await load(); };
  const load=async()=>{ const j=await (await fetch('/api/soc/feeds/list')).json(); setList(j); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Threat Feeds</h2>
    <div><input value={key} onChange={e=>setKey(e.target.value)}/><input value={url} onChange={e=>setUrl(e.target.value)} style={{marginLeft:8,width:360}}/><button onClick={upsert} style={{marginLeft:8}}>Save</button></div>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:8}}>{JSON.stringify(list,null,2)}</pre>
  </section>;
}
