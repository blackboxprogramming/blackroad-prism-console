import React, { useEffect, useState } from 'react';

export default function PORTAL_Reports(){
  const [digest,setDigest]=useState('No digest yet'); const [acks,setAcks]=useState('No ack gaps'); const [eng,setEng]=useState('No engagement');
  const load=async()=>{ try{ const d=await (await fetch('/portal/reports/DIGEST_00000000.md')).text(); setDigest(d);}catch{} try{ const a=await (await fetch('/portal/reports/ACK_GAPS_000000.md')).text(); setAcks(a);}catch{} try{ const e=await (await fetch('/portal/reports/ENGAGE_000000.md')).text(); setEng(e);}catch{} };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Portal Reports</h2>
    <h3>Daily Digest</h3><pre style={{background:'#f7f7f7',padding:8}}>{digest}</pre>
    <h3>Ack Gaps</h3><pre style={{background:'#f7f7f7',padding:8}}>{acks}</pre>
    <h3>Engagement</h3><pre style={{background:'#f7f7f7',padding:8}}>{eng}</pre>
  </section>;
}
