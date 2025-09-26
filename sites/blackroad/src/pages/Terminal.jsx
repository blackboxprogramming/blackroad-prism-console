import { useRef, useState } from "react";
export default function Terminal(){
  const [lines,setLines]=useState(["Type 'help' or 'health'."]); const inputRef=useRef(null);
  const run = async (cmd)=>{
    const [c,...rest]=cmd.trim().split(/\s+/);
    if(!c) return;
    if(c==="help") return ["help, health, echo <text>, clear"];
    if(c==="echo") return [rest.join(" ")];
    if(c==="clear") return ["\x07"]; // bell; UI clears
    if(c==="health"){ try{ const r=await fetch("/api/health",{cache:"no-store"}); return [await r.text()]; }catch(e){ return [String(e)]; } }
    return [`unknown: ${c}`];
  };
  const onKey = async (e)=>{ if(e.key==="Enter"){ e.preventDefault(); const v=e.currentTarget.value; e.currentTarget.value="";
    setLines(x=>[...x,`$ ${v}`]); const out=await run(v); if(out?.[0]==="\x07"){ setLines([]); return; } setLines(x=>[...x,...out]); } };
  return (
    <div>
      <h2 className="text-lg font-semibold mb-2">Terminal</h2>
      <div className="h-56 overflow-auto border border-neutral-800 rounded p-2 bg-black/50 mb-2">
        {lines.map((l,i)=>(<div key={i} className="font-mono text-sm">{l}</div>))}
      </div>
      <input ref={inputRef} onKeyDown={onKey} placeholder="type a command…" className="w-full p-2 rounded bg-neutral-900 border border-neutral-700 font-mono"/>
    </div>);
}
