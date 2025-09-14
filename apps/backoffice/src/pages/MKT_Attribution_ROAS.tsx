import React, { useEffect, useState } from 'react';

export default function MKT_Attribution_ROAS(){
  const [touch,setTouch]=useState({subjectId:'u1',type:'click',utm:{source:'email',medium:'newsletter',campaign:'q4-launch'},campaignId:'CMP-1'});
  const [spend,setSpend]=useState({period:new Date().toISOString().slice(0,7),campaignId:'CMP-1',channel:'email',amount:500});
  const [period,setPeriod]=useState(new Date().toISOString().slice(0,7));
  const [attr,setAttr]=useState<any>({}); const [roas,setRoas]=useState<any>({});
  const addTouch=async()=>{ await fetch('/api/mkt/touch',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(touch)}); };
  const compute=async()=>{ const j=await (await fetch('/api/mkt/attr/compute',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({period})})).json(); setAttr(j); };
  const ingestSpend=async()=>{ await fetch('/api/mkt/spend/ingest',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(spend)}); };
  const summary=async()=>{ const j=await (await fetch(`/api/mkt/roas/summary?period=${period}`)).json(); setRoas(j); };
  useEffect(()=>{},[]);
  return <section><h2>Attribution & ROAS</h2>
    <div><button onClick={addTouch}>Add Touch</button><button onClick={compute} style={{marginLeft:8}}>Compute Attribution</button><button onClick={ingestSpend} style={{marginLeft:8}}>Ingest Spend</button><button onClick={summary} style={{marginLeft:8}}>ROAS Summary</button></div>
    <textarea value={JSON.stringify(touch,null,2)} onChange={e=>setTouch(JSON.parse(e.target.value))} style={{width:'100%',height:110,marginTop:8}}/>
    <textarea value={JSON.stringify(spend,null,2)} onChange={e=>setSpend(JSON.parse(e.target.value))} style={{width:'100%',height:90,marginTop:8}}/>
    <div style={{marginTop:8}}>Period: <input value={period} onChange={e=>setPeriod(e.target.value)}/></div>
    <h4 style={{marginTop:8}}>Attribution</h4><pre style={{background:'#f7f7f7',padding:8}}>{JSON.stringify(attr,null,2)}</pre>
    <h4>ROAS</h4><pre style={{background:'#f7f7f7',padding:8}}>{JSON.stringify(roas,null,2)}</pre>
  </section>;
}
