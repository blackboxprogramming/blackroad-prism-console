import React, { useEffect, useState } from 'react';

export default function IAM_Reports(){
  const [access,setAccess]=useState('No report yet'); const [secrets,setSecrets]=useState('No report yet');
  const load=async()=>{ try{ const a=await (await fetch('/iam/reports/ACCESS_000000.md')).text(); setAccess(a);}catch{} try{ const s=await (await fetch('/iam/reports/SECRETS_000000.md')).text(); setSecrets(s);}catch{} };
  useEffect(()=>{ load(); },[]);
  return <section><h2>IAM Reports</h2>
    <h3>Access Digest</h3><pre style={{background:'#f7f7f7',padding:8}}>{access}</pre>
    <h3>Secrets Rotation</h3><pre style={{background:'#f7f7f7',padding:8}}>{secrets}</pre>
  </section>;
}
