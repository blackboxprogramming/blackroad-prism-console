import React, { useEffect, useState } from 'react';

export default function BI_Datasets(){
  const [name,setName]=useState('finance_arr'); const [txt,setTxt]=useState(''); const [json,setJson]=useState<any>(null);
  const load=async()=>{ const t=await (await fetch(`/api/bi/dataset/${name}`)).text(); setTxt(t); try{ setJson(JSON.parse(t)); }catch{ setJson(null); } };
  useEffect(()=>{ load(); },[]);
  return <section><h2>BI Datasets</h2>
    <input value={name} onChange={e=>setName(e.target.value)}/><button onClick={load} style={{marginLeft:8}}>Load</button>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{json?JSON.stringify(json,null,2):txt||'No data'}</pre>
  </section>;
}
