import React, { useEffect, useState } from 'react';

export default function MDM_Rules(){
  const [domain,setDomain]=useState('accounts');
  const [rules,setRules]=useState('{"domain":"accounts","match":{"keys":[{"name":"domain","weight":1},{"name":"name","weight":0.5}],"threshold":0.85},"survivorship":{"precedence":["CRM","ERP","*"],"tie_break":"recent"}}');
  const [view,setView]=useState<any>(null);
  const save=async()=>{ await fetch('/api/mdm/rules/set',{method:'POST',headers:{'Content-Type':'application/json'},body:rules}); await load(); };
  const load=async()=>{ const j=await (await fetch(`/api/mdm/rules/${domain}`)).json(); setView(j); };
  useEffect(()=>{ load(); },[domain]);
  return <section><h2>Match & Survivorship Rules</h2>
    <div><input value={domain} onChange={e=>setDomain(e.target.value)}/></div>
    <textarea value={rules} onChange={e=>setRules(e.target.value)} style={{width:'100%',height:180}}/>
    <div><button onClick={save}>Save</button><button onClick={load} style={{marginLeft:8}}>Load</button></div>
    {view && <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(view,null,2)}</pre>}
  </section>;
}
