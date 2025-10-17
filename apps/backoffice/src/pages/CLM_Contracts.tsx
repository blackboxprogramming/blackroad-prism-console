import React, { useEffect, useState } from 'react';

export default function CLM_Contracts(){
  const [c,setC]=useState({contractId:'C-1',templateKey:'msa',counterparty:'Acme Corp',effective:'2025-09-01',term_months:24,fields:{liability_cap:'12mo fees'}});
  const [view,setView]=useState<any>({});
  const create=async()=>{ await fetch('/api/clm/contracts/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(c)}); };
  const attach=async()=>{ await fetch('/api/clm/contracts/attach',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({contractId:c.contractId,fileRef:'s3://contracts/C-1-v1.docx',kind:'draft'})}); };
  const redline=async()=>{ await fetch('/api/clm/contracts/redline',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({contractId:c.contractId,version:'v1',author:'counterparty',diff_md:'- Change liability cap'})}); };
  const load=async()=>{ const j=await (await fetch(`/api/clm/contracts/${c.contractId}`)).json(); setView(j); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Drafting & Redlines</h2>
    <div><input value={c.contractId} onChange={e=>setC({...c,contractId:e.target.value})}/><input value={c.templateKey} onChange={e=>setC({...c,templateKey:e.target.value})} style={{marginLeft:8}}/><button onClick={create} style={{marginLeft:8}}>Create</button><button onClick={attach} style={{marginLeft:8}}>Attach</button><button onClick={redline} style={{marginLeft:8}}>Redline</button><button onClick={load} style={{marginLeft:8}}>Load</button></div>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(view,null,2)}</pre>
  </section>;
}
