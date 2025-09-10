import { useEffect, useMemo, useRef, useState } from "react";
import ActiveReflection from "./ActiveReflection.jsx";

export default function MinimalSurfaceLab(){
  const [N,setN]=useState(96);
  const [iters,setIters]=useState(200);
  const [amp,setAmp]=useState(0.5);   // boundary height amplitude
  const [mode,setMode]=useState("saddle"); // boundary shape
  const cnv=useRef(null);
  const sim=useMemo(()=>makeSim(N, amp, mode),[N,amp,mode]);

  useEffect(()=>{
    const c=cnv.current; if(!c) return; c.width=N; c.height=N;
    const ctx=c.getContext("2d",{alpha:false});
    for(let k=0;k<iters;k++) relax(sim);
    render(ctx, sim);
  },[sim,iters,N]);

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">Minimal Surfaces — Soap Film Toy</h2>
      <canvas ref={cnv} style={{width:"100%", imageRendering:"pixelated"}}/>
      <div className="grid" style={{gridTemplateColumns:"1fr 320px", gap:16}}>
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <Radio name="mode" value={mode} set={setMode} opts={[["saddle","saddle"],["bowl","bowl"],["ridge","ridge"]]} />
          <Slider label="grid N" v={N} set={setN} min={48} max={192} step={8}/>
          <Slider label="relax iters" v={iters} set={setIters} min={40} max={1200} step={20}/>
          <Slider label="boundary amp" v={amp} set={setAmp} min={0.1} max={1.2} step={0.05}/>
          <button className="mt-2 px-3 py-1 rounded bg-white/10 border border-white/10" onClick={()=>seed(sim, amp, mode)}>Reseed</button>
        </section>
        <ActiveReflection
          title="Active Reflection — Minimal Surface"
          storageKey="reflect_minimal"
          prompts={[
            "Switch boundary shapes: where does the film ‘pull tight’ the most?",
            "Increase iterations: do wrinkles smooth out uniformly?",
            "Compare saddle vs bowl: where is curvature positive/negative?"
          ]}
        />
      </div>
    </div>
  );
}

function makeSim(N, A, mode){
  const u = Array.from({length:N},()=>Array(N).fill(0));
  seed({N,u}, A, mode);
  return {N,u};
}
function seed(sim, A, mode){
  const {N,u}=sim;
  for(let y=0;y<N;y++) for(let x=0;x<N;x++) u[y][x]=0;
  for(let i=0;i<N;i++){
    const t=i/(N-1);
    const b = (mode==="saddle") ? A*(2*t-1) : (mode==="bowl") ? A*(0.5 - Math.abs(t-0.5))*2 : (mode==="ridge") ? A*Math.sin(Math.PI*t) : 0;
    u[0][i]=b; u[N-1][i]=-b; u[i][0]= -b; u[i][N-1]= b;
  }
}
function relax(sim){
  const {N,u}=sim;
  for(let y=1;y<N-1;y++){
    for(let x=1;x<N-1;x++){
      // boundary check: if any neighbor equals current (fixed boundary pattern), skip fix by tagging? Simpler: only relax interior where boundary was zero initially.
      // Here we detect boundary if on border; interior free.
      if(x===0||x===N-1||y===0||y===N-1) continue;
      u[y][x] = 0.25*(u[y-1][x]+u[y+1][x]+u[y][x-1]+u[y][x+1]);
    }
  }
}
function render(ctx, sim){
  const {N,u}=sim;
  const img=ctx.createImageData(N,N);
  let mn=Infinity, mx=-Infinity;
  for(let y=0;y<N;y++) for(let x=0;x<N;x++){ const v=u[y][x]; if(v<mn) mn=v; if(v>mx) mx=v; }
  for(let y=0;y<N;y++) for(let x=0;x<N;x++){
    const v=(u[y][x]-mn)/(mx-mn+1e-9);
    const R=Math.floor(40+200*v), G=Math.floor(50+180*(1-v)), B=Math.floor(220*(1-v));
    const off=4*(y*N+x);
    img.data[off]=R; img.data[off+1]=G; img.data[off+2]=B; img.data[off+3]=255;
  }
  ctx.putImageData(img,0,0);
}
function Slider({label,v,set,min,max,step}){
  const show=typeof v==='number'&&v.toFixed ? v.toFixed(3):v;
  return (<div className="mb-2">
    <label className="text-sm opacity-80">{label}: <b>{show}</b></label>
    <input className="w-full" type="range" min={min} max={max} step={step} value={v}
      onChange={e=>set(parseFloat(e.target.value))}/>
  </div>);
}
function Radio({name,value,set,opts}){
  return (<div className="flex gap-3 text-sm">
    {opts.map(([val,lab])=><label key={val} className="flex items-center gap-1">
      <input type="radio" name={name} checked={value===val} onChange={()=>set(val)}/>{lab}
    </label>)}
  </div>);
}

