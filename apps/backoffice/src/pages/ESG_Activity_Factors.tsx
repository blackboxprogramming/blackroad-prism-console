import React, { useEffect, useState } from 'react';

export default function ESG_Activity_Factors(){
  const [facs,setFacs]=useState({source:'DEFRA_2024',version:'2024',items:[{key:'electricity',unit:'kWh',factor:0.000233,scope:'S2'},{key:'fuel',unit:'L',factor:0.0027,scope:'S1'}]});
  const [act,setAct]=useState({activityId:'a-1',category:'electricity',unit:'kWh',amount:1000,period:new Date().toISOString().slice(0,7),facilityId:'hq'});
  const [fview,setF]=useState<any>(null); const [alist,setA]=useState<any>({});
  const saveF=async()=>{ await fetch('/api/esg/factors/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(facs)}); await loadF(); };
  const ingest=async()=>{ await fetch('/api/esg/activity/ingest',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(act)}); await recent(); };
  const loadF=async()=>{ const j=await (await fetch(`/api/esg/factors/${facs.source}`)).json(); setF(j); };
  const recent=async()=>{ const j=await (await fetch(`/api/esg/activity/recent?category=${act.category}&period=${act.period}`)).json(); setA(j); };
  useEffect(()=>{ loadF(); recent(); },[]);
  return <section><h2>ESG: Activity & Factors</h2>
    <div><button onClick={saveF}>Save Factors</button><button onClick={ingest} style={{marginLeft:8}}>Ingest Activity</button></div>
    <textarea value={JSON.stringify(facs,null,2)} onChange={e=>setFacs(JSON.parse(e.target.value))} style={{width:'100%',height:140,marginTop:8}}/>
    <textarea value={JSON.stringify(act,null,2)} onChange={e=>setAct(JSON.parse(e.target.value))} style={{width:'100%',height:120,marginTop:8}}/>
    {fview && <pre style={{background:'#f7f7f7',padding:8,marginTop:8}}>{JSON.stringify(fview,null,2)}</pre>}
    <pre style={{background:'#f7f7f7',padding:8,marginTop:8}}>{JSON.stringify(alist,null,2)}</pre>
  </section>;
}
