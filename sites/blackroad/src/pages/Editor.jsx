import { useState } from "react";
export default function Editor(){
  const [code,setCode]=useState(`function add(a,b){return a+b}\nconsole.log("add(2,3) =", add(2,3))`);
  const [out,setOut]=useState("");
  const run = ()=>{ try{
      const logs=[]; const orig=console.log; console.log=(...a)=>logs.push(a.join(" "));
      new Function(code)(); console.log=orig; setOut(logs.join("\n")||"(no output)");
    }catch(e){ setOut(String(e)); } };
  return (
    <div>
      <h2 className="text-lg font-semibold mb-2">Editor</h2>
      <textarea className="w-full h-40 p-2 font-mono rounded bg-neutral-900 border border-neutral-700" value={code} onChange={e=>setCode(e.target.value)} />
      <div className="mt-2"><button className="btn-primary" onClick={run}>Run</button></div>
      <pre className="mt-2 p-2 bg-black/60 rounded h-40 overflow-auto">{out}</pre>
    </div>);
}
