import React, { useEffect, useState } from 'react';

export default function Tax_Files(){
  const [list,setList]=useState<any>({files:[]});
  const load=async()=>{ const j=await (await fetch('/api/tax/files/recent')).json(); setList(j); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Tax Files</h2>
    <pre style={{background:'#f7f7f7',padding:8}}>{JSON.stringify(list,null,2)}</pre>
  </section>;
}
