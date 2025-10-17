import React, { useEffect, useState } from 'react';

export default function PORTAL_Preferences(){
  const [prefs,setPrefs]=useState({subjectId:'u1',channels:{email:true,slack:false,web:true},topics:['allhands','security']});
  const [ack,setAck]=useState({subjectId:'u1',ref:{type:'announcement',id:'ann-1'},required:false});
  const [loaded,setLoaded]=useState<any>({});
  const save=async()=>{ await fetch('/api/portal/prefs/set',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(prefs)}); await load(); };
  const record=async()=>{ await fetch('/api/portal/acks/record',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(ack)}); alert('ack recorded'); };
  const load=async()=>{ const j=await (await fetch(`/api/portal/prefs/${prefs.subjectId}`)).json(); setLoaded(j); };
  const status=async()=>{ const j=await (await fetch('/api/portal/acks/status?refType=announcement&refId=ann-1')).json(); alert(JSON.stringify(j)); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Preferences & Acknowledgements</h2>
    <div><button onClick={save}>Save Prefs</button><button onClick={record} style={{marginLeft:8}}>Record Ack</button><button onClick={status} style={{marginLeft:8}}>Ack Status</button></div>
    <textarea value={JSON.stringify(prefs,null,2)} onChange={e=>setPrefs(JSON.parse(e.target.value))} style={{width:'100%',height:120,marginTop:8}}/>
    <textarea value={JSON.stringify(ack,null,2)} onChange={e=>setAck(JSON.parse(e.target.value))} style={{width:'100%',height:100,marginTop:8}}/>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(loaded,null,2)}</pre>
  </section>;
}
