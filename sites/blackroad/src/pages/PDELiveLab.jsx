import { useEffect, useMemo, useRef, useState } from "react";
import ActiveReflection from "./ActiveReflection.jsx";

export default function PDELiveLab(){
  const [N,setN]=useState(128);
  const [mode,setMode]=useState("heat"); // "heat" or "wave"
  const [alpha,setAlpha]=useState(0.2);  // heat diffusivity
  const [c,setC]=useState(0.9);         // wave speed (normalized)
  const [running,setRunning]=useState(true);
  const [seed,setSeed]=useState(7);

  const cnv=useRef(null);
  const sim=useMemo(()=> makeSim(N, seed),[N,seed]);

  useEffect(()=>{
    const c2=cnv.current; if(!c2) return;
    c2.width=N; c2.height=N;
    const ctx=c2.getContext("2d",{alpha:false});
    let raf;
    const loop=()=>{
      if(running) step(sim, mode, alpha, c);
      render(ctx, sim.u);
      raf=requestAnimationFrame(loop);
    };
    loop(); return ()=> cancelAnimationFrame(raf);
  },[sim, mode, alpha, c, running, N]);

  useEffect(()=>{
    const c2=cnv.current; if(!c2) return;
    const rect=c2.getBoundingClientRect();
    const click=(e)=>{
      const x=Math.floor((e.clientX-rect.left)/rect.width*N);
      const y=Math.floor((e.clientY-rect.top)/rect.height*N);
      seedBump(sim, x, y, mode);
    };
    c2.addEventListener("mousedown", click);
    return ()=> c2.removeEventListener("mousedown", click);
  },[sim, mode, N]);

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">PDE Live — Heat & Wave</h2>
      <canvas ref={cnv} style={{width:"100%", imageRendering:"pixelated"}}/>
      <div className="grid" style={{gridTemplateColumns:"1fr 320px", gap:16}}>
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <Radio name="mode" value={mode} set={setMode} opts={[["heat","heat"],["wave","wave"]]} />
          <Slider label="N" v={N} set={setN} min={96} max={192} step={16}/>
          <Slider label="α (heat)" v={alpha} set={setAlpha} min={0.05} max={0.4} step={0.01}/>
          <Slider label="c (wave)" v={c} set={setC} min={0.2} max={1.2} step={0.02}/>
            <button className="mt-2 px-3 py-1 rounded bg-white/10 border border-white/10" onClick={()=>{reset(sim);}}>Reset</button>
            <button className="ml-2 px-3 py-1 rounded bg-white/10 border border-white/10" onClick={()=>setRunning(r=>!r)}>{running?"Pause":"Run"}</button>
          <p className="text-xs opacity-70 mt-2">Click canvas to add a bump (heat) or displacement (wave).</p>
        </section>
        <ActiveReflection
          title="Active Reflection — PDE"
          storageKey="reflect_pde_live"
          prompts={[
            "Heat: higher α smooths faster — where do gradients vanish first?",
            "Wave: CFL stability — what happens if c is large (try near 1.2 vs 0.6)?",
            "Compare boundary effects: reflections vs diffusion into zero walls."
          ]}
        />
      </div>
    </div>
  );
}

function makeSim(N, seed){
  const u = Array.from({length:N},()=>Array(N).fill(0));
  const uPrev = Array.from({length:N},()=>Array(N).fill(0));
  // seed gentle bump
  for(let y=N/3;y<2*N/3;y++) for(let x=N/3;x<2*N/3;x++){
    u[y][x] = Math.exp(-((x-N/2)**2+(y-N/2)**2)/(2*(N/12)**2));
  }
  for(let y=0;y<N;y++) for(let x=0;x<N;x++) uPrev[y][x]=u[y][x];
  return {N, u, uPrev};
}
function reset(sim){ const {N,u,uPrev}=sim; for(let y=0;y<N;y++) for(let x=0;x<N;x++){ u[y][x]=0; uPrev[y][x]=0; } }
function seedBump(sim,x,y,mode){
  const {N,u,uPrev}=sim;
  const r=N/32; for(let j=-r;j<=r;j++) for(let i=-r;i<=r;i++){
    const X=Math.max(1, Math.min(N-2, x+i)), Y=Math.max(1, Math.min(N-2, y+j));
    const v=Math.exp(-(i*i+j*j)/(2*(r*0.6)**2));
    if(mode==="heat") u[Y][X]+=0.8*v; else u[Y][X]+=1.0*v;
  }
  if(mode==="wave"){ for(let y=0;y<N;y++) for(let x=0;x<N;x++) uPrev[y][x]=u[y][x]; }
}
function step(sim, mode, alpha, c){
  const {N,u,uPrev}=sim;
  const lap = (x,y)=> u[y-1][x]+u[y+1][x]+u[y][x-1]+u[y][x+1]-4*u[y][x];
  if(mode==="heat"){
    const dt = 0.2; // stable for alpha<=0.4 with 2D 5-point
    const nu=Array.from({length:N},()=>Array(N).fill(0));
    for(let y=1;y<N-1;y++) for(let x=1;x<N-1;x++) nu[y][x]=u[y][x] + alpha*dt*lap(x,y);
    for(let y=1;y<N-1;y++) for(let x=1;x<N-1;x++) u[y][x]=nu[y][x];
  }else{
    const dt=0.18; // modest CFL
    const nu=Array.from({length:N},()=>Array(N).fill(0));
    for(let y=1;y<N-1;y++) for(let x=1;x<N-1;x++){
      const l = lap(x,y);
      nu[y][x] = 2*u[y][x] - uPrev[y][x] + (c*c*dt*dt)*l;
    }
    for(let y=1;y<N-1;y++) for(let x=1;x<N-1;x++){ uPrev[y][x]=u[y][x]; u[y][x]=nu[y][x]; }
  }
}
function render(ctx, U){
  const N=U.length; const img=ctx.createImageData(N,N);
  let mn=Infinity,mx=-Infinity; for(let y=0;y<N;y++) for(let x=0;x<N;x++){ mn=Math.min(mn,U[y][x]); mx=Math.max(mx,U[y][x]); }
  for(let y=0;y<N;y++) for(let x=0;x<N;x++){
    const z=(U[y][x]-mn)/(mx-mn+1e-9);
    const off=4*(y*N+x);
    const R=Math.floor(40+200*z), G=Math.floor(50+180*(1-z)), B=Math.floor(220*(1-z));
    img.data[off]=R; img.data[off+1]=G; img.data[off+2]=B; img.data[off+3]=255;
  }
  ctx.putImageData(img,0,0);
}
function Slider({label,v,set,min,max,step}){ const show=(typeof v==='number'&&v.toFixed)?v.toFixed(2):v;
  return (<div className="mb-2"><label className="text-sm opacity-80">{label}: <b>{show}</b></label>
  <input className="w-full" type="range" min={min} max={max} step={step}
  value={v} onChange={e=>set(parseFloat(e.target.value))}/></div>);
}
function Radio({name,value,set,opts}){
  return (<div className="flex gap-3 text-sm">
    {opts.map(([val,lab])=><label key={val} className="flex items-center gap-1">
      <input type="radio" name={name} checked={value===val} onChange={()=>set(val)}/>{lab}
    </label>)}
  </div>);
}

