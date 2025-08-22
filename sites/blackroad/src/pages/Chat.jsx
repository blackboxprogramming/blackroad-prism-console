import { useState } from "react";
export default function Chat(){
  const [msgs,setMsgs]=useState([{role:"system",text:"Welcome to BlackRoad."}]);
  const [input,setInput]=useState("");
  const send = async ()=>{
    if(!input.trim()) return;
    const prompt=input; setInput(""); setMsgs(m=>[...m,{role:"user",text:prompt}]);
    const r = await fetch("/api/llm/chat",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({prompt})}).catch(()=>null);
    const data = await r?.json().catch(()=>({reply:"(no reply)"}));
    setMsgs(m=>[...m,{role:"assistant",text:data.reply||"(no reply)"}]);
  };
  return (
    <div>
      <h2 className="text-lg font-semibold mb-2">Chat</h2>
      <div className="h-64 overflow-y-auto border border-neutral-800 rounded p-2 mb-3 bg-black/30">
        {msgs.map((m,i)=>(<div key={i} className="mb-1"><b>{m.role}:</b> {m.text}</div>))}
      </div>
      <div className="flex gap-2">
        <input className="w-full p-2 rounded bg-neutral-900 border border-neutral-700" value={input} onChange={e=>setInput(e.target.value)} placeholder="Type…" />
        <button className="btn-primary" onClick={send}>Send</button>
      </div>
    </div>
  );
}
