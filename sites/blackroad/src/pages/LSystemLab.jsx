import { useMemo, useRef, useState, useEffect } from "react";
import ActiveReflection from "./ActiveReflection.jsx";

export default function LSystemLab(){
  const [axiom,setAxiom]=useState("F");
  const [ruleF,setRuleF]=useState("F[+F]F[-F]F");
  const [angle,setAngle]=useState(25);
  const [iters,setIters]=useState(4);
  const [len,setLen]=useState(8);

  const str = useMemo(()=> expand(axiom, {F:ruleF}, iters), [axiom,ruleF,iters]);
  const cnv=useRef(null);
  useEffect(()=>{
    const W=640,H=480;
    const c=cnv.current; if(!c) return; c.width=W; c.height=H;
    const ctx=c.getContext("2d",{alpha:false});
    ctx.clearRect(0,0,W,H);
    drawL(ctx, str, angle*(Math.PI/180), len, W, H);
  },[str,angle,len]);

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">L-Systems — Plant Fractals</h2>
      <canvas ref={cnv} style={{width:"100%", maxWidth:640, height:480}}/>
      <div className="grid" style={{gridTemplateColumns:"1fr 320px", gap:16}}>
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <Text label="axiom" v={axiom} set={setAxiom}/>
          <Text label="rule F →" v={ruleF} set={setRuleF}/>
          <Slider label="angle (deg)" v={angle} set={setAngle} min={5} max={60} step={1}/>
          <Slider label="iterations" v={iters} set={setIters} min={0} max={7} step={1}/>
          <Slider label="segment length" v={len} set={setLen} min={3} max={20} step={1}/>
        </section>
        <ActiveReflection
          title="Active Reflection — L-systems"
          storageKey="reflect_lsystems"
          prompts={[
            "Increase iterations: how does complexity explode vs. readability?",
            "Change angle: which angles yield ‘planty’ vs ‘crystalline’ shapes?",
            "Try a new rule: F→F[+F]F[-F][F] or F→FF; what emerges?"
          ]}
        />
      </div>
    </div>
  );
}

function expand(axiom, rules, iters){
  let s=axiom;
  for(let k=0;k<iters;k++){
    let t="";
    for(const ch of s){ t += rules[ch] ?? ch; }
    s=t;
  }
  return s;
}
function drawL(ctx, s, ang, len, W,H){
  // turtle: F=forward, +=turn left, -=turn right, [] push/pop
  let x=W/2, y=H-10, th=-Math.PI/2;
  const st=[];
  ctx.beginPath();
  for(const ch of s){
    if(ch==="F"){
      const nx=x + len*Math.cos(th);
      const ny=y + len*Math.sin(th);
      ctx.moveTo(x,y); ctx.lineTo(nx,ny);
      x=nx; y=ny;
    }else if(ch==="+"){ th+=ang; }
    else if(ch==="-"){ th-=ang; }
    else if(ch==="["){ st.push([x,y,th]); }
    else if(ch==="]"){ const t=st.pop(); if(t){ x=t[0]; y=t[1]; th=t[2]; } }
  }
  ctx.stroke();
}
function Slider({label,v,set,min,max,step}){
  const show = typeof v==='number'&&v.toFixed ? v.toFixed(3):v;
  return (<div className="mb-2"><label className="text-sm opacity-80">{label}: <b>{show}</b></label>
    <input className="w-full" type="range" min={min} max={max} step={step}
      value={v} onChange={e=>set(parseFloat(e.target.value))}/></div>);
}
function Text({label,v,set}){
  return (<div className="mb-2">
    <label className="text-sm opacity-80">{label}</label>
    <input className="w-full p-2 rounded bg-white/10 border border-white/10" value={v} onChange={e=>set(e.target.value)}/>
  </div>);
}

