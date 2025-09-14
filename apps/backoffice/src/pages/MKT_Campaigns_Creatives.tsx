import React, { useEffect, useState } from 'react';

export default function MKT_Campaigns_Creatives(){
  const [camp,setCamp]=useState({campaignId:'CMP-1',name:'Q4 Launch',channel:'email',audienceId:'aud-us',start:'2025-10-01',end:'2025-10-31',budget:10000,utm:{source:'email',medium:'newsletter',campaign:'q4-launch'},objectives:['signup']});
  const [creative,setCreative]=useState({id:'welcome.md',channel:'email',name:'Welcome Email',template_md:'# Welcome!'});
  const [view,setView]=useState<any>(null);
  const createC=async()=>{ await fetch('/api/mkt/campaigns/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(camp)}); await load(); };
  const saveCr=async()=>{ await fetch('/api/mkt/creatives/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(creative)}); };
  const load=async()=>{ const j=await (await fetch(`/api/mkt/campaigns/${camp.campaignId}`)).json(); setView(j); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Campaigns & Creatives</h2>
    <div><button onClick={createC}>Create Campaign</button><button onClick={saveCr} style={{marginLeft:8}}>Save Creative</button><button onClick={load} style={{marginLeft:8}}>View Campaign</button></div>
    <textarea value={JSON.stringify(camp,null,2)} onChange={e=>setCamp(JSON.parse(e.target.value))} style={{width:'100%',height:140,marginTop:8}}/>
    <textarea value={JSON.stringify(creative,null,2)} onChange={e=>setCreative(JSON.parse(e.target.value))} style={{width:'100%',height:120,marginTop:8}}/>
    {view && <pre style={{background:'#f7f7f7',padding:8,marginTop:8}}>{JSON.stringify(view,null,2)}</pre>}
  </section>;
}
