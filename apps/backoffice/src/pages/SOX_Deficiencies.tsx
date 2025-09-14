import React, { useEffect, useState } from 'react';

export default function SOX_Deficiencies(){
  const [items,setItems]=useState<any[]>([]); const [sev,setSev]=useState('');
  const log=async()=>{ const controlId=prompt('Control ID?')||''; const severity=prompt('Severity (low|moderate|significant|material)?','moderate')||'moderate'; const description=prompt('Description?')||''; await fetch('/api/sox/deficiency/log',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({controlId,severity,description,cause:'',impact:'',likelihood:'possible',refTests:[]})}); await load(); };
  const remediate=async()=>{ const deficiencyId=prompt('Deficiency ID?')||''; const action=prompt('Action?')||''; await fetch('/api/sox/deficiency/remediation',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({deficiencyId,action,owner:'Controller',due:new Date().toISOString().slice(0,10)})}); };
  const load=async()=>{ const j=await (await fetch(`/api/sox/deficiency/recent${sev?`?severity=${sev}`:''}`)).json(); setItems(j.items||[]); };
  useEffect(()=>{ load(); },[sev]);
  return <section><h2>Deficiencies & Remediation</h2>
    <div><select value={sev} onChange={e=>setSev(e.target.value)}><option value="">All</option><option>low</option><option>moderate</option><option>significant</option><option>material</option></select><button onClick={log} style={{marginLeft:8}}>Log</button><button onClick={remediate} style={{marginLeft:8}}>Remediate</button><button onClick={load} style={{marginLeft:8}}>Refresh</button></div>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(items,null,2)}</pre>
  </section>;
}
