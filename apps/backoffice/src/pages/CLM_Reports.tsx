import React, { useEffect, useState } from 'react';

export default function CLM_Reports(){
  const [oblig,setOblig]=useState('No obligations report'); const [renew,setRenew]=useState('No renewals report'); const [repo,setRepo]=useState('No repo report');
  const load=async()=>{ try{ const o=await (await fetch('/clm/reports/OBLIG_000000.md')).text(); setOblig(o);}catch{} try{ const r=await (await fetch('/clm/reports/RENEW_000000.md')).text(); setRenew(r);}catch{} try{ const p=await (await fetch('/clm/reports/REPO_000000.md')).text(); setRepo(p);}catch{} };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Reports</h2>
    <h3>Obligations</h3>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:8,whiteSpace:'pre-wrap'}}>{oblig}</pre>
    <h3>Renewals</h3>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:8,whiteSpace:'pre-wrap'}}>{renew}</pre>
    <h3>Repository</h3>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:8,whiteSpace:'pre-wrap'}}>{repo}</pre>
  </section>;
}
