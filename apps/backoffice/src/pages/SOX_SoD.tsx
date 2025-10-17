import React from 'react';

export default function SOX_SoD(){
  const save=async()=>{ const ruleId='PAYMENTS_T0XIC'; const description='Create Vendor + Approve Payment'; const toxic_pairs=[{roleA:'AP_CREATE_VENDOR',roleB:'AP_APPROVE_PAYMENT'}]; await fetch('/api/sox/sod/rules/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ruleId,description,toxic_pairs,systems:['ERP']})}); alert('Saved'); };
  const scan=async()=>{ const users=[{id:'u1',roles:['AP_CREATE_VENDOR','AP_APPROVE_PAYMENT']},{id:'u2',roles:['AP_CREATE_VENDOR']}]; const j=await (await fetch('/api/sox/sod/scan',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({system:'ERP',users})})).json(); alert(JSON.stringify(j)); };
  const rules=async()=>{ const j=await (await fetch('/api/sox/sod/rules')).json(); alert(JSON.stringify(j)); };
  return <section><h2>Segregation of Duties</h2>
    <div><button onClick={save}>Save Rule</button><button onClick={scan} style={{marginLeft:8}}>Scan</button><button onClick={rules} style={{marginLeft:8}}>Rules</button></div>
  </section>;
}
