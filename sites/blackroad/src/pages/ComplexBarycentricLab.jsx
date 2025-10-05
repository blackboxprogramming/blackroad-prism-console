import { useEffect, useMemo, useRef, useState } from "react";
import ActiveReflection from "./ActiveReflection.jsx";

function add([a,b],[c,d]){ return [a+c,b+d]; }
function sub([a,b],[c,d]){ return [a-c,b-d]; }
function mul([a,b],[c,d]){ return [a*c - b*d, a*d + b*c]; }
function area2(a,b,c){ // signed double area
  return (b[0]-a[0])*(c[1]-a[1]) - (b[1]-a[1])*(c[0]-a[0]);
}

export default function ComplexBarycentricLab(){
  const [A,setA]=useState([80,260]), [B,setB]=useState([520,260]), [C,setC]=useState([300,80]);
  const [w,setW]=useState([0.33,0.33,0.34]); // barycentric weights
  const cnv=useRef(null);
  const dragRef=useRef(null);
  const downRef=useRef(false);
  const ARef=useRef(A);
  const BRef=useRef(B);
  const CRef=useRef(C);

  useEffect(()=>{ ARef.current=A; },[A]);
  useEffect(()=>{ BRef.current=B; },[B]);
  useEffect(()=>{ CRef.current=C; },[C]);

  const P = useMemo(()=> {
    const s=w[0]+w[1]+w[2] || 1e-9;
    const u=[(w[0]/s), (w[1]/s), (w[2]/s)];
    return [
      u[0]*A[0] + u[1]*B[0] + u[2]*C[0],
      u[0]*A[1] + u[1]*B[1] + u[2]*C[1],
    ];
  },[A,B,C,w]);

  useEffect(()=>{
    const c=cnv.current; if(!c) return;
    const ctx=c.getContext("2d",{alpha:false});
    const W=640,H=360; c.width=W; c.height=H;
    ctx.clearRect(0,0,W,H);
    // triangle
    ctx.beginPath(); ctx.moveTo(A[0],A[1]); ctx.lineTo(B[0],B[1]); ctx.lineTo(C[0],C[1]); ctx.closePath(); ctx.stroke();
    // point
    ctx.beginPath(); ctx.arc(P[0],P[1],4,0,Math.PI*2); ctx.stroke();
    // vertices
    for(const p of [A,B,C]){ ctx.beginPath(); ctx.arc(p[0],p[1],5,0,Math.PI*2); ctx.stroke(); }
    // medians-ish: show weights text
    ctx.font="12px monospace";
    ctx.fillText(`w = [${w.map(x=>x.toFixed(3)).join(", ")}], sum=${(w[0]+w[1]+w[2]).toFixed(3)}`, 12,16);
  },[A,B,C,P,w]);

  useEffect(()=>{
    const c=cnv.current; if(!c) return;
    const onDown=e=>{
      downRef.current=true;
      const r=c.getBoundingClientRect();
      const x=e.clientX-r.left, y=e.clientY-r.top;
      const hit = hitWhich([x,y], [ARef.current, BRef.current, CRef.current], 9);
      if(hit>=0){
        dragRef.current=hit;
      }else{
        const Acur=ARef.current, Bcur=BRef.current, Ccur=CRef.current;
        const S=area2(Acur,Bcur,Ccur) || 1e-9;
        const w0=area2([x,y],Bcur,Ccur)/S, w1=area2(Acur,[x,y],Ccur)/S, w2=area2(Acur,Bcur,[x,y])/S;
        setW([w0,w1,w2]);
      }
    };
    const onMove=e=>{
      if(!downRef.current || dragRef.current===null) return;
      const r=c.getBoundingClientRect();
      const x=e.clientX-r.left, y=e.clientY-r.top;
      if(dragRef.current===0) setA([x,y]);
      else if(dragRef.current===1) setB([x,y]);
      else setC([x,y]);
    };
    const onUp=()=>{
      downRef.current=false;
      dragRef.current=null;
    };
    c.addEventListener("mousedown",onDown);
    window.addEventListener("mousemove",onMove);
    window.addEventListener("mouseup",onUp);
    return ()=>{
      downRef.current=false;
      dragRef.current=null;
      c.removeEventListener("mousedown",onDown);
      window.removeEventListener("mousemove",onMove);
      window.removeEventListener("mouseup",onUp);
    };
  },[]);

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">Complex Barycentric — click to solve weights</h2>
      <canvas ref={cnv} style={{width:"100%"}}/>
      <div className="grid" style={{gridTemplateColumns:'1fr 320px', gap:16}}>
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <Slider label="w₀" v={w[0]} set={(x)=>setW([x,w[1],w[2]])} min={-1} max={2} step={0.01}/>
          <Slider label="w₁" v={w[1]} set={(x)=>setW([w[0],x,w[2]])} min={-1} max={2} step={0.01}/>
          <Slider label="w₂" v={w[2]} set={(x)=>setW([w[0],w[1],x])} min={-1} max={2} step={0.01}/>
          <p className="text-sm mt-2">Click inside/outside the triangle to set weights from area ratios (sum auto-normalized in the point display).</p>
        </section>
        <ActiveReflection
          title="Active Reflection — Barycentric"
          storageKey="reflect_bary"
          prompts={[
            "Move a vertex: how do weights change if you keep the point still?",
            "Click outside the triangle: notice negative barycentric weights.",
            "Why do weights sum to 1 regardless of triangle shape?"
          ]}
        />
      </div>
    </div>
  );
}
function hitWhich(p, arr, rad){
  const r2=rad*rad;
  for(let i=0;i<arr.length;i++){
    const dx=p[0]-arr[i][0], dy=p[1]-arr[i][1];
    if(dx*dx+dy*dy<=r2) return i;
  }
  return -1;
}
function Slider({label,v,set,min,max,step}){
  const show=(typeof v==='number'&&v.toFixed)?v.toFixed(3):v;
  return (<div className="mb-2"><label className="text-sm opacity-80">{label}: <b>{show}</b></label>
  <input className="w-full" type="range" min={min} max={max} step={step}
    value={v} onChange={e=>set(parseFloat(e.target.value))}/></div>);
}

