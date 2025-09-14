import React, { useEffect, useState } from 'react';

export default function MKT_Audiences_Journeys(){
  const [aud,setAud]=useState({id:'aud-us',name:'US Audience',definition:{rules:[{attr:'country',op:'eq',value:'US'}]},owner:'growth'});
  const [jour,setJour]=useState({key:'welcome_flow',name:'Welcome Flow',audienceId:'aud-us',triggers:[{type:'event',value:'signup'}],steps:[{channel:'email',template:'welcome.md',wait_s:0,guard:{consent:true}}],owner:'lifecycle'});
  const [av,setAv]=useState<any>(null); const [jv,setJv]=useState<any>(null);
  const saveA=async()=>{ await fetch('/api/mkt/audiences/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(aud)}); await loadA(); };
  const saveJ=async()=>{ await fetch('/api/mkt/journeys/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(jour)}); await loadJ(); };
  const loadA=async()=>{ const j=await (await fetch(`/api/mkt/audiences/${aud.id}`)).json(); setAv(j); };
  const loadJ=async()=>{ const j=await (await fetch(`/api/mkt/journeys/${jour.key}`)).json(); setJv(j); };
  useEffect(()=>{ loadA(); loadJ(); },[]);
  return <section><h2>Audiences & Journeys</h2>
    <div><input value={aud.id} onChange={e=>setAud({...aud,id:e.target.value})}/><button onClick={saveA} style={{marginLeft:8}}>Save Audience</button></div>
    <div style={{marginTop:8}}><input value={jour.key} onChange={e=>setJour({...jour,key:e.target.value})}/><button onClick={saveJ} style={{marginLeft:8}}>Save Journey</button></div>
    <textarea value={JSON.stringify(aud,null,2)} onChange={e=>setAud(JSON.parse(e.target.value))} style={{width:'100%',height:140,marginTop:8}}/>
    <textarea value={JSON.stringify(jour,null,2)} onChange={e=>setJour(JSON.parse(e.target.value))} style={{width:'100%',height:140,marginTop:8}}/>
    {av && <pre style={{background:'#f7f7f7',padding:8,marginTop:8}}>{JSON.stringify(av,null,2)}</pre>}
    {jv && <pre style={{background:'#f7f7f7',padding:8,marginTop:8}}>{JSON.stringify(jv,null,2)}</pre>}
  </section>;
}
