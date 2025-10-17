import React, { useEffect, useState } from 'react';

export default function DQ_Expectations(){
  const [yaml,setYaml]=useState('expectations:\n  not_null:\n    params: { columns: ["metric","value"] }'); const [list,setList]=useState<any>({});
  const save=async()=>{ await fetch('/api/dq/expectations/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({yaml})}); await load(); };
  const load=async()=>{ const j=await (await fetch('/api/dq/expectations/list')).json(); setList(j); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Expectations Library</h2>
    <textarea value={yaml} onChange={e=>setYaml(e.target.value)} style={{width:'100%',height:180}}/>
    <div><button onClick={save} style={{marginTop:8}}>Save</button></div>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:8}}>{JSON.stringify(list,null,2)}</pre>
  </section>;
}
