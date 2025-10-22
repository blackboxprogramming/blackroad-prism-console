import React, { useEffect, useState } from 'react';

export default function WFM_Rosters(){
  const [ros,setRos]=useState({rosterId:'R-2025-09-22',teamId:'ENG-PLAT',date:'2025-09-22',assignments:[{subjectId:'u1',shift_code:'STD'},{subjectId:'u2',shift_code:'STD'}]});
  const [swap,setSwap]=useState({rosterId:'R-2025-09-22',a:{subjectId:'u1',shift_code:'STD'},b:{subjectId:'u2',shift_code:'STD'}});
  const [recent,setRecent]=useState<any>({});
  const create=async()=>{ await fetch('/api/wfm/rosters/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(ros)}); await load(); };
  const doSwap=async()=>{ await fetch('/api/wfm/rosters/swap',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(swap)}); };
  const load=async()=>{ const j=await (await fetch('/api/wfm/rosters/recent?teamId=ENG-PLAT')).json(); setRecent(j); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Rosters</h2>
    <div><button onClick={create}>Create</button><button onClick={doSwap} style={{marginLeft:8}}>Swap</button><button onClick={load} style={{marginLeft:8}}>Recent</button></div>
    <textarea value={JSON.stringify(ros,null,2)} onChange={e=>setRos(JSON.parse(e.target.value))} style={{width:'100%',height:140,marginTop:8}}/>
    <textarea value={JSON.stringify(swap,null,2)} onChange={e=>setSwap(JSON.parse(e.target.value))} style={{width:'100%',height:120,marginTop:8}}/>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(recent,null,2)}</pre>
  </section>;
}
