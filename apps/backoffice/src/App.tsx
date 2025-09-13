import React, { useEffect, useState } from 'react';
import KeyTable from './components/KeyTable';
import WebhookTable from './components/WebhookTable';
export default function App(){
  const [keys,setKeys]=useState<any[]>([]);
  const [hooks,setHooks]=useState<any[]>([]);
  useEffect(()=>{ fetch('/api/admin/keys/list').then(r=>r.json()).then(d=>setKeys(d.keys||[])); fetch('/api/admin/webhooks/list').then(r=>r.json()).then(setHooks); },[]);
  return <div style={{fontFamily:'system-ui', padding:16}}>
    <h1>BlackRoad Backoffice</h1>
    <h2>API Keys</h2>
    <KeyTable rows={keys}/>
    <h2>Webhooks</h2>
    <WebhookTable rows={hooks}/>
  </div>;
}
