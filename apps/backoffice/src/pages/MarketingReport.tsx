import React, { useEffect, useState } from 'react';

export default function MarketingReport(){
  const [md,setMd]=useState('Loading…'); const [file,setFile]=useState('');
  const load=async()=>{ const month=new Date().toISOString().slice(0,7).replace('-',''); const path=`marketing/reports/MKT_${month}.md`; try{ const t=await (await fetch(`/${path}`)).text(); setMd(t); setFile(path);} catch{ setMd('No report yet.'); } };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Marketing Report</h2><p><code>{file}</code></p><pre style={{background:'#f7f7f7',padding:8}}>{md}</pre></section>;
}
