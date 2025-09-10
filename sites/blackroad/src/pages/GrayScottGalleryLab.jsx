import { useEffect, useMemo, useRef, useState } from "react";
import ActiveReflection from "./ActiveReflection.jsx";

/** u_t = Du ∇²u - u v^2 + F(1-u)
 *  v_t = Dv ∇²v + u v^2 - (F+k) v
 *  (periodic bounds). This gallery provides named presets & controls. */
function idx(N,x,y){ const X=(x+N)%N, Y=(y+N)%N; return Y*N+X; }

const PRESETS = [
  {name:"Pearls",    F:0.022, k:0.051},
  {name:"Mazes",     F:0.029, k:0.057},
  {name:"Spots",     F:0.037, k:0.065},
  {name:"Waves",     F:0.026, k:0.055},
  {name:"Leopard",   F:0.02,  k:0.05 },
];

export default function GrayScottGalleryLab(){
  const [N,setN]=useState(160);
  const [Du,setDu]=useState(0.16), [Dv,setDv]=useState(0.08);
  const [F,setF]=useState(PRESETS[0].F), [k,setK]=useState(PRESETS[0].k);
  const [dt,setDT]=useState(1.0);
  const [running,setRunning]=useState(true);
  const [seed,setSeed]=useState(42);

  const sim=useMemo(()=> init(N, seed),[N,seed]);

  const cnv=useRef(null);
  useEffect(()=>{
    const c=cnv.current; if(!c) return; c.width=N; c.height=N;
    const ctx=c.getContext("2d",{alpha:false});
    let raf;
    const loop=()=>{
      if(running) evolve(sim, Du, Dv, F, k, dt, 10);
      render(ctx, sim);
      raf=requestAnimationFrame(loop);
    };
    loop(); return ()=> cancelAnimationFrame(raf);
  },[sim,Du,Dv,F,k,dt,running,N]);

  const applyPreset = (p)=>{ setF(p.F); setK(p.k); };

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">Gray–Scott Gallery — Presets</h2>
      <canvas ref={cnv} style={{width:"100%", imageRendering:"pixelated"}}/>
      <div className="grid" style={{gridTemplateColumns:'1fr 360px', gap:16}}>
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          {PRESETS.map(p=>(
            <button key={p.name} className="mr-2 mb-2 px-2 py-1 rounded bg-white/10 border border-white/10" onClick={()=>applyPreset(p)}>{p.name}</button>
          ))}
          <div className="mt-2">
            <button className="px-2 py-1 rounded bg-white/10 border border-white/10" onClick={()=>setRunning(r=>!r)}>{running?"Pause":"Run"}</button>
            <button className="ml-2 px-2 py-1 rounded bg-white/10 border border-white/10" onClick={()=>seedSim(sim)}>Reseed</button>
          </div>
        </section>
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <Slider label="grid N" v={N} set={setN} min={120} max={240} step={20}/>
          <Slider label="Du" v={Du} set={setDu} min={0.01} max={0.3} step={0.005}/>
          <Slider label="Dv" v={Dv} set={setDv} min={0.01} max={0.3} step={0.005}/>
          <Slider label="F"  v={F}  set={setF}  min={0.01} max={0.08} step={0.001}/>
          <Slider label="k"  v={k}  set={setK}  min={0.03} max={0.08} step={0.001}/>
          <Slider label="dt" v={dt} set={setDT} min={0.2} max={2.0} step={0.05}/>
          <ActiveReflection
            title="Active Reflection — Gray–Scott Gallery"
            storageKey="reflect_gs_gallery"
            prompts={[
              "Each (F,k) regime creates different motifs; explore transitions.",
              "Du/Dv ratio warps stripe thickness vs dot sizes — notice trends.",
              "Reseed and pause to compare early vs late morphology."
            ]}
          />
        </section>
      </div>
    </div>
  );
}

function init(N, seed){
  const u=new Float32Array(N*N), v=new Float32Array(N*N);
  for(let y=0;y<N;y++) for(let x=0;x<N;x++){ u[idx(N,x,y)]=1; v[idx(N,x,y)]=0; }
  seedSim({N,u,v});
  return {N,u,v,tmpu:new Float32Array(N*N), tmpv:new Float32Array(N*N)};
}
function seedSim(sim){
  const {N,u,v}=sim;
  for(let y=0;y<N;y++) for(let x=0;x<N;x++){ u[idx(N,x,y)]=1; v[idx(N,x,y)]=0; }
  // random sprinkles in center
  for(let y=N/2-10|0; y<N/2+10|0; y++) for(let x=N/2-10|0; x<N/2+10|0; x++){
    u[idx(N,x,y)] = 0.5 + 0.5*Math.random();
    v[idx(N,x,y)] = 0.25*Math.random();
  }
}
function lap(U,N,x,y){ return U[idx(N,x-1,y)]+U[idx(N,x+1,y)]+U[idx(N,x,y-1)]+U[idx(N,x,y+1)] - 4*U[idx(N,x,y)]; }
function evolve(sim,Du,Dv,F,k,dt,sub){
  const {N,u,v,tmpu,tmpv}=sim; const sdt=dt/sub;
  for(let s=0;s<sub;s++){
    for(let y=1;y<N-1;y++) for(let x=1;x<N-1;x++){
      const i=idx(N,x,y), uvv=u[i]*v[i]*v[i];
      tmpu[i]= u[i] + sdt*( Du*lap(u,N,x,y) - uvv + F*(1-u[i]) );
      tmpv[i]= v[i] + sdt*( Dv*lap(v,N,x,y) + uvv - (F+k)*v[i] );
    }
    for(let y=1;y<N-1;y++) for(let x=1;x<N-1;x++){ const i=idx(N,x,y); u[i]=tmpu[i]; v[i]=tmpv[i]; }
  }
}
function render(ctx, sim){
  const {N,u,v}=sim; const img=ctx.createImageData(N,N);
  for(let y=0;y<N;y++) for(let x=0;x<N;x++){
    const i=idx(N,x,y); const a=u[i], b=v[i];
    const R=Math.floor(255*Math.sqrt(Math.max(0,a))), G=Math.floor(255*(0.5*b + 0.5*a)), B=Math.floor(255*Math.sqrt(Math.max(0,b)));
    const off=4*i; img.data[off]=R; img.data[off+1]=G; img.data[off+2]=B; img.data[off+3]=255;
  }
  ctx.putImageData(img,0,0);
}
function Slider({label,v,set,min,max,step}){ const show=(typeof v==='number'&&v.toFixed)?v.toFixed(3):v;
  return (<div className="mb-2"><label className="text-sm opacity-80">{label}: <b>{show}</b></label>
    <input className="w-full" type="range" min={min} max={max} step={step}
           value={v} onChange={e=>set(parseFloat(e.target.value))}/></div>);
}

