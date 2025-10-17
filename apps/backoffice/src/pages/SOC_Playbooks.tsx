import React, { useEffect, useState } from 'react';

export default function SOC_Playbooks(){
  const [yaml,setYaml]=useState('block_ip:\n  steps:\n    - action: block\n      target: 1.2.3.4'); const [key,setKey]=useState('block_ip');
  const upsert=async()=>{ await fetch('/api/soc/playbooks/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key,yaml})}); alert('Saved'); };
  const execute=async()=>{ const caseId=prompt('Case ID?')||''; await fetch('/api/soc/playbooks/execute',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key,caseId})}); alert('Executed'); };
  return <section><h2>SOAR Playbooks</h2>
    <div><input value={key} onChange={e=>setKey(e.target.value)}/><button onClick={upsert} style={{marginLeft:8}}>Save</button><button onClick={execute} style={{marginLeft:8}}>Execute</button></div>
    <textarea value={yaml} onChange={e=>setYaml(e.target.value)} style={{width:'100%',height:140,marginTop:8}}/>
  </section>;
}
