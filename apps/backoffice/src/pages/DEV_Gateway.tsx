
import React, { useEffect, useState } from 'react';

export default function DEV_Gateway(){
  const [proxyBody,setProxyBody]=useState('{"api":"ledger","path":"/balances","method":"GET","key":"", "headers":{}}');
  const [logs,setLogs]=useState<any>({});
  const call=async()=>{ const j=await (await fetch('/api/dev/gw/proxy',{method:'POST',headers:{'Content-Type':'application/json'},body:proxyBody})).json(); alert(JSON.stringify(j)); await recent(); };
  const recent=async()=>{ const j=await (await fetch('/api/dev/gw/logs')).json(); setLogs(j); };
  useEffect(()=>{ recent(); },[]);
  return <section><h2>Gateway Proxy & Logs</h2>
    <textarea value={proxyBody} onChange={e=>setProxyBody(e.target.value)} style={{width:'100%',height:110}}/><div><button onClick={call}>Call (Stub)</button><button onClick={recent} style={{marginLeft:8}}>Recent Logs</button></div>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(logs,null,2)}</pre>
  </section>;
}
