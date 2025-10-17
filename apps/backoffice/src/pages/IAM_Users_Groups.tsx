import React, { useEffect, useState } from 'react';

export default function IAM_Users_Groups(){
  const [user,setUser]=useState({id:'u1',email:'user@acme.com',name:'User One',status:'active',attributes:{dept:'ENG'}});
  const [group,setGroup]=useState({id:'admin',name:'admin',members:['u1']});
  const [view,setView]=useState<any>(null);
  const saveU=async()=>{ await fetch('/api/iam/users/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(user)}); await load(); };
  const saveG=async()=>{ await fetch('/api/iam/groups/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(group)}); };
  const load=async()=>{ const j=await (await fetch(`/api/iam/users/${user.id}`)).json(); setView(j); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Users & Groups</h2>
    <div><input value={user.id} onChange={e=>setUser({...user,id:e.target.value})}/><input value={user.email} onChange={e=>setUser({...user,email:e.target.value})} style={{marginLeft:8}}/><button onClick={saveU} style={{marginLeft:8}}>Save User</button></div>
    <div style={{marginTop:8}}><input value={group.id} onChange={e=>setGroup({...group,id:e.target.value})}/><input value={group.name} onChange={e=>setGroup({...group,name:e.target.value})} style={{marginLeft:8}}/><button onClick={saveG} style={{marginLeft:8}}>Save Group</button></div>
    {view && <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(view,null,2)}</pre>}
  </section>;
}
