import { useEffect, useMemo, useRef, useState } from "react";
import ActiveReflection from "./ActiveReflection.jsx";

/** Cahn–Hilliard: ∂c/∂t = ∇²( c^3 − c − ε² ∇² c )
 *  Periodic BCs, explicit toy (small dt, modest N). */
function idx(N,x,y){ const X=(x+N)%N, Y=(y+N)%N; return Y*N+X; }

export default function CahnHilliardLab(){
  const [N,setN]=useState(128);
  const [eps,setEps]=useState(0.9);
  const [dt,setDT]=useState(0.01);
  const [steps,setSteps]=useState(8);
  const [running,setRunning]=useState(true);
  const [seed,setSeed]=useState(42);

  const cnv=useRef(null);
  const state=useMemo(()=> init(N, seed),[N,seed]);

  useEffect(()=>{
    const c=cnv.current; if(!c) return; c.width=N; c.height=N;
    const ctx=c.getContext("2d",{alpha:false});
    let raf;
    const loop=()=>{
      if(running) for(let s=0;s<steps;s++) step(state, eps, dt);
      render(ctx, state.c);
      raf=requestAnimationFrame(loop);
    };
    loop(); return ()=> cancelAnimationFrame(raf);
  },[state,eps,dt,steps,running,N]);

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">Phase-Field — Cahn–Hilliard (toy)</h2>
      <canvas ref={cnv} style={{width:"100%", imageRendering:"pixelated"}}/>
      <div className="grid" style={{gridTemplateColumns:"1fr 360px", gap:16}}>
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <button className="px-3 py-1 rounded bg-white/10 border border-white/10" onClick={()=>reset(state, N, seed)}>Reseed</button>
          <button className="ml-2 px-3 py-1 rounded bg-white/10 border border-white/10" onClick={()=>setRunning(r=>!r)}>{running?"Pause":"Run"}</button>
        </section>
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <Slider label="grid N" v={N} set={setN} min={96} max={192} step={16}/>
          <Slider label="ε (interface)" v={eps} set={setEps} min={0.4} max={1.4} step={0.05}/>
          <Slider label="dt" v={dt} set={setDT} min={0.003} max={0.02} step={0.001}/>
          <Slider label="steps/frame" v={steps} set={setSteps} min={1} max={30} step={1}/>
          <Slider label="seed" v={seed} set={setSeed} min={1} max={9999} step={1}/>
          <ActiveReflection
            title="Active Reflection — Cahn–Hilliard"
            storageKey="reflect_ch"
            prompts={[
              "Smaller ε → thinner interfaces (but stiffer numerics).",
              "Decrease dt: patterns evolve gently without blowup.",
              "Do you see coarsening (domains merging) over time?"
            ]}
          />
        </section>
      </div>
    </div>
  );
}

function init(N, seed){
  const r=(()=>{ let s=seed|0||1; return ()=> (s=(1664525*s+1013904223)>>>0)/2**32; })();
  const c=new Float32Array(N*N);
  for(let y=0;y<N;y++) for(let x=0;x<N;x++) c[idx(N,x,y)] = 0.1*(r()*2-1);
  return {N, c, tmp:new Float32Array(N*N), mu:new Float32Array(N*N)};
}
function reset(state,N,seed){ const s=init(N,seed); state.c.set(s.c); }
function laplacian(N, arr, out){
  for(let y=0;y<N;y++){
    for(let x=0;x<N;x++){
      const i=idx(N,x,y);
      out[i] = arr[idx(N,x-1,y)] + arr[idx(N,x+1,y)] + arr[idx(N,x,y-1)] + arr[idx(N,x,y+1)] - 4*arr[i];
    }
  }
}
function step(state, eps, dt){
  const {N,c,tmp,mu}=state;
  // μ = f'(c) − ε² ∇² c,  where f(c) = (c^2 − 1)^2 / 4 → f' = c^3 − c
  laplacian(N, c, tmp);
  for(let i=0;i<N*N;i++) mu[i] = (c[i]*c[i]*c[i] - c[i]) - (eps*eps)*tmp[i];
  // ∂c/∂t = ∇² μ
  laplacian(N, mu, tmp);
  for(let i=0;i<N*N;i++) c[i] += dt * tmp[i];
}
function render(ctx, c){
  const N=Math.sqrt(c.length)|0;
  const img=ctx.createImageData(N,N);
  let mn=Infinity,mx=-Infinity; for(let i=0;i<c.length;i++){ if(c[i]<mn) mn=c[i]; if(c[i]>mx) mx=c[i]; }
  for(let y=0;y<N;y++) for(let x=0;x<N;x++){
    const v=(c[idx(N,x,y)]-mn)/(mx-mn+1e-9);
    const off=4*(y*N+x);
    img.data[off]=Math.floor(40+200*v);
    img.data[off+1]=Math.floor(50+180*(1-v));
    img.data[off+2]=Math.floor(220*(1-v));
    img.data[off+3]=255;
  }
  ctx.putImageData(img,0,0);
}
function Slider({label,v,set,min,max,step}){ const show=(typeof v==='number'&&v.toFixed)?v.toFixed(3):v;
  return (<div className="mb-2"><label className="text-sm opacity-80">{label}: <b>{show}</b></label>
   <input className="w-full" type="range" min={min} max={max} step={step}
    value={v} onChange={e=>set(parseFloat(e.target.value))}/></div>);
}
