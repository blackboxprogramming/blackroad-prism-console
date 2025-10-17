import React, { useEffect, useState } from 'react';

export default function Privacy_Policies(){
  const [pol,setPol]=useState('[{"id":"gdpr","title":"GDPR Policy","md":"# GDPR\\n..."}]');
  const [cls,setCls]=useState('[{"name":"PII","patterns":["email","phone","ssn"]},{"name":"Sensitive","patterns":["passport"]}]');
  const [view,setView]=useState<any>({}); const [classes,setClasses]=useState<any>({});
  const save=async()=>{ await fetch('/api/privacy/policies/set',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({policies:JSON.parse(pol)})}); await load(); };
  const saveC=async()=>{ await fetch('/api/privacy/classifications/set',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({classes:JSON.parse(cls)})}); await load(); };
  const load=async()=>{ const p=await (await fetch('/api/privacy/policies')).json(); const c=await (await fetch('/api/privacy/classifications')).json(); setView(p); setClasses(c); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Policies & Classifications</h2>
    <textarea value={pol} onChange={e=>setPol(e.target.value)} style={{width:'100%',height:140}}/><div><button onClick={save}>Save Policies</button></div>
    <textarea value={cls} onChange={e=>setCls(e.target.value)} style={{width:'100%',height:120,marginTop:8}}/><div><button onClick={saveC}>Save Classes</button></div>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify({policies:view,classes},null,2)}</pre>
  </section>;
}
