import React, { useEffect, useState } from 'react';

export default function People(){
  const [tree,setTree]=useState<any>({tree:[]});
  const refresh = async ()=> { const j = await (await fetch('/api/hr/org/tree')).json(); setTree(j); };
  const upsert = async ()=> {
    const email = prompt('Email?')||''; const name=prompt('Name?')||''; const title=prompt('Title?')||''; const managerId=prompt('Manager ID (email)?')||'';
    await fetch('/api/hr/org/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,name,title,managerId})}); await refresh();
  };
  useEffect(()=>{ refresh(); },[]);
  const render=(n:any)=> <li key={n.id}><b>{n.name}</b> — {n.title||''}{n.reports?.length?<ul>{n.reports.map(render)}</ul>:null}</li>;
  return <section><h2>Org Chart</h2><button onClick={upsert}>Add/Update</button><button onClick={refresh} style={{marginLeft:8}}>Refresh</button><ul>{(tree.tree||[]).map(render)}</ul></section>;
}
