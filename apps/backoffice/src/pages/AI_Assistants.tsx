import React, { useEffect, useState } from 'react';

export default function AI_Assistants(){
  const [id,setId]=useState('ops'); const [promptKey,setPromptKey]=useState('assistant'); const [tools,setTools]=useState('["search"]'); const [packs,setPacks]=useState('["kb"]'); const [view,setView]=useState<any>(null);
  const upsert=async()=>{ await fetch('/api/ai/assistants/upsert',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,promptKey,tools:JSON.parse(tools),packs:JSON.parse(packs),safety:{mode:"standard"}})}); await load(); };
  const load=async()=>{ const j=await (await fetch(`/api/ai/assistants/${id}`)).json(); setView(j); };
  const run=async()=>{ const input=prompt('Input?')||''; const j=await (await fetch('/api/ai/assistants/run',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,input})})).json(); alert(JSON.stringify(j)); };
  useEffect(()=>{ load(); },[]);
  return <section><h2>Assistants</h2>
    <div><input value={id} onChange={e=>setId(e.target.value)}/><input placeholder="prompt key" value={promptKey} onChange={e=>setPromptKey(e.target.value)} style={{marginLeft:8}}/>
      <input placeholder="tools json" value={tools} onChange={e=>setTools(e.target.value)} style={{marginLeft:8,width:260}}/>
      <input placeholder="packs json" value={packs} onChange={e=>setPacks(e.target.value)} style={{marginLeft:8,width:260}}/>
      <button onClick={upsert} style={{marginLeft:8}}>Upsert</button><button onClick={run} style={{marginLeft:8}}>Run</button><button onClick={load} style={{marginLeft:8}}>Load</button></div>
    {view && <pre style={{background:'#f7f7f7',padding:8,marginTop:8}}>{JSON.stringify(view,null,2)}</pre>}
  </section>;
}
