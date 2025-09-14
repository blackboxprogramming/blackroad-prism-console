import React from 'react';

export default function Patch_Console(){
  const ingest=async()=>{ const body={source:'nist',items:[{cve:'CVE-2025-0001',cvss:8.1,affected:{type:'host',id:'host-1'}}]}; await fetch('/api/patch/vuln/ingest',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}); };
  const create=async()=>{ const body={planId:'PT-1',title:'Sept Patch',window:{start:'2025-09-21',end:'2025-09-22'},targets:[{type:'host',id:'host-1'}],actions:[{id:'a1',desc:'apply kernel patch'}]}; await fetch('/api/patch/plan/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}); };
  const exec=async()=>{ await fetch('/api/patch/plan/execute',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({planId:'PT-1'})}); };
  const view=async()=>{ const j=await (await fetch('/api/patch/plan/PT-1')).json(); alert(JSON.stringify(j)); };
  return <section><h2>Patch & Vulnerability</h2>
    <div><button onClick={ingest}>Ingest CVEs</button><button onClick={create} style={{marginLeft:8}}>Create Plan</button><button onClick={exec} style={{marginLeft:8}}>Execute</button><button onClick={view} style={{marginLeft:8}}>View</button></div>
  </section>;
}
