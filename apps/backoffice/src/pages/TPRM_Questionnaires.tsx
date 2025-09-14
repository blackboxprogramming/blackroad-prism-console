import React, { useEffect, useState } from 'react';

export default function TPRM_Questionnaires(){
  const [send,setSend]=useState({vendorId:'vend-1',framework:'SIG',version:'2025',due:'2025-10-15',sections:[]});
  const [submit,setSubmit]=useState({vendorId:'vend-1',framework:'SIG',answers:{q1:'yes'},attachments:['s3://evidence/soc2.pdf']});
  const [status,setStatus]=useState<any>({});
  const doSend=async()=>{ await fetch('/api/tprm/questionnaires/send',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(send)}); await get(); };
  const doSubmit=async()=>{ await fetch('/api/tprm/questionnaires/submit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(submit)}); await get(); };
  const get=async()=>{ const j=await (await fetch(`/api/tprm/questionnaires/status?vendorId=${send.vendorId}`)).json(); setStatus(j); };
  useEffect(()=>{ get(); },[]);
  return <section><h2>Questionnaires</h2>
    <div><button onClick={doSend}>Send</button><button onClick={doSubmit} style={{marginLeft:8}}>Submit</button><button onClick={get} style={{marginLeft:8}}>Status</button></div>
    <textarea value={JSON.stringify(send,null,2)} onChange={e=>setSend(JSON.parse(e.target.value))} style={{width:'100%',height:120,marginTop:8}}/>
    <textarea value={JSON.stringify(submit,null,2)} onChange={e=>setSubmit(JSON.parse(e.target.value))} style={{width:'100%',height:120,marginTop:8}}/>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(status,null,2)}</pre>
  </section>;
}
