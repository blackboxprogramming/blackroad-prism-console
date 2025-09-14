import React, { useEffect, useState } from 'react';

export default function IAM_IdP(){
  const [form,setForm]=useState({id:'okta',type:'oidc',issuer:'https://example.okta.com',client_id:'abc',client_secret:'<REDACTED>',metadata_url:'',sso_url:''});
  const [list,setList]=useState<any>({});
  const save=async()=>{ await fetch('/api/iam/idp/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)}); await load(); };
  const load=async()=>{ const j=await (await fetch('/api/iam/idp/list')).json(); setList(j); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Identity Providers (SSO)</h2>
    <div><input value={form.id} onChange={e=>setForm({...form,id:e.target.value})}/><select value={form.type} onChange={e=>setForm({...form,type:e.target.value})} style={{marginLeft:8}}><option>oidc</option><option>saml</option></select><input value={form.issuer} onChange={e=>setForm({...form,issuer:e.target.value})} style={{marginLeft:8}}/><button onClick={save} style={{marginLeft:8}}>Save</button></div>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(list,null,2)}</pre>
  </section>;
}
