import React, { useEffect, useState } from 'react';

export default function SUP_Bot_Automation(){
  const [intents,setIntents]=useState('{"intents":[{"key":"hours","utterances":["hours","when open"],"reply_md":"We are open 9–5 CT."}]}');
  const [macros,setMacros]=useState('{"macros":[{"id":"close_with_csat","title":"Close + CSAT","actions":[{"type":"status","value":"solved"},{"type":"reply","value":"Thanks! Please rate us."}]}]}');
  const [replyBody,setReply]=useState('{"ticketId":"T-1001","text":"What time are you open?"}');
  const [out,setOut]=useState<any>({});
  const saveI=async()=>{ await fetch('/api/support/bot/intents/set',{method:'POST',headers:{'Content-Type':'application/json'},body:intents}); };
  const saveM=async()=>{ await fetch('/api/support/macros/set',{method:'POST',headers:{'Content-Type':'application/json'},body:macros}); };
  const ask=async()=>{ const j=await (await fetch('/api/support/bot/reply',{method:'POST',headers:{'Content-Type':'application/json'},body:replyBody})).json(); setOut(j); };
  useEffect(()=>{},[]);
  return <section><h2>Bot & Automation</h2>
    <div><button onClick={saveI}>Save Intents</button><button onClick={saveM} style={{marginLeft:8}}>Save Macros</button><button onClick={ask} style={{marginLeft:8}}>Ask Bot</button></div>
    <textarea value={intents} onChange={e=>setIntents(e.target.value)} style={{width:'100%',height:120,marginTop:8}}/>
    <textarea value={macros} onChange={e=>setMacros(e.target.value)} style={{width:'100%',height:100,marginTop:8}}/>
    <textarea value={replyBody} onChange={e=>setReply(e.target.value)} style={{width:'100%',height:90,marginTop:8}}/>
    <pre style={{background:'#f7f7f7',padding:8,marginTop:12}}>{JSON.stringify(out,null,2)}</pre>
  </section>;
}
