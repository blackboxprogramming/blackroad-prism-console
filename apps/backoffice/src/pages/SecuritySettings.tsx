import React, { useEffect, useState } from 'react';

export default function SecuritySettings(){
  const [sso,setSso]=useState<any>({});
  const [holds,setHolds]=useState<number>(0);

  useEffect(()=>{ fetch('/saml/metadata').then(r=>setSso({enabled:r.ok})).catch(()=>setSso({enabled:false})); },[]);

  const addHold = async () => {
    const email = prompt('Email or User ID for legal hold?')||'';
    const r = await fetch('/api/edr/legal-hold/add',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email})});
    const j = await r.json(); setHolds(j.count||0);
  };
  const exportAudit = async () => {
    const now = Date.now();
    const r = await fetch(`/api/edr/export/audit?from=${now-7*86400000}&to=${now}`);
    const j = await r.json(); alert('Export ready: '+j.file);
  };

  return <section>
    <h2>Security Settings</h2>
    <div>SSO (SAML): <b>{sso.enabled?'Enabled':'Disabled'}</b></div>
    <div>SCIM: <code>Bearer …</code></div>
    <div style={{marginTop:12}}>
      <button onClick={addHold}>Add Legal Hold</button>
      <button onClick={exportAudit} style={{marginLeft:8}}>Export Audit (7d)</button>
      <div style={{marginTop:8}}>Legal holds count: {holds}</div>
    </div>
  </section>;
}
