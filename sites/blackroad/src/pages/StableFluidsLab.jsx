import { useEffect, useRef, useState } from "react";
import ActiveReflection from "./ActiveReflection.jsx";

/** Minimal Jos Stam “Stable Fluids”:
 *  grid N×N, velocities u,v; dye d.
 *  Steps per frame: add forces → diffuse → project → advect (vel, dye) → project.
 */
export default function StableFluidsLab(){
  const [N,setN]=useState(96), [dt,setDT]=useState(0.1), [visc,setVisc]=useState(0.0001), [diff,setDiff]=useState(0.00001);
  const [force,setForce]=useState(40), [dye,setDye]=useState(60);
  const [running,setRunning]=useState(true);
  const cnv=useRef(null);

  const simRef = useRef(null);
  useEffect(()=>{ simRef.current = makeSim(N); },[N]);

  useEffect(()=>{
    const c=cnv.current; if(!c) return; c.width=N; c.height=N;
    const ctx=c.getContext("2d",{alpha:false});
    let raf; const loop=()=>{
      if(running && simRef.current){
        step(simRef.current,{dt, visc, diff});
        inject(simRef.current, {force, dye});
      }
      render(ctx, simRef.current);
      raf=requestAnimationFrame(loop);
    };
    loop(); return ()=>cancelAnimationFrame(raf);
  },[running,dt,visc,diff,force,dye]);

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">Stable Fluids — 2D Smoke</h2>
      <div className="grid" style={{gridTemplateColumns:"1fr 320px", gap:16}}>
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <canvas ref={cnv} style={{width:"100%", imageRendering:"pixelated"}}/>
          <div className="mt-2 flex gap-2">
            <button onClick={()=>setRunning(r=>!r)} className="px-3 py-1 rounded bg-white/10 border border-white/10">{running?"Pause":"Run"}</button>
            <button onClick={()=>{ simRef.current = makeSim(N); }} className="px-3 py-1 rounded bg-white/10 border border-white/10">Reset</button>
          </div>
        </section>
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <Slider label="N" v={N} set={setN} min={48} max={160} step={16}/>
          <Slider label="dt" v={dt} set={setDT} min={0.02} max={0.2} step={0.01}/>
          <Slider label="viscosity" v={visc} set={setVisc} min={0} max={0.001} step={0.00001}/>
          <Slider label="diffusion" v={diff} set={setDiff} min={0} max={0.001} step={0.00001}/>
          <Slider label="force" v={force} set={setForce} min={0} max={200} step={1}/>
          <Slider label="dye" v={dye} set={setDye} min={0} max={200} step={1}/>
          <ActiveReflection
            title="Active Reflection — Stable Fluids"
            storageKey="reflect_fluids"
            prompts={[
              "Increase viscosity: how do vortices decay?",
              "Change dt: when does the sim become unstable or smeared?",
              "Force vs dye: try strong momentum with little dye; what do you see?"
            ]}
          />
        </section>
      </div>
    </div>
  );
}

function makeSim(N){
  const size=N*N;
  return {
    N,
    u:new Float32Array(size), v:new Float32Array(size),
    u0:new Float32Array(size), v0:new Float32Array(size),
    d:new Float32Array(size), d0:new Float32Array(size)
  };
}
const IX=(N,x,y)=> Math.max(0,Math.min(N-1,x)) + N*Math.max(0,Math.min(N-1,y));

function addSource(dst, src, s){ for(let i=0;i<dst.length;i++) dst[i]+=s*src[i]; }

function diffuse(N, x, x0, diff, dt){
  const a = dt*diff*N*N;
  for(let k=0;k<20;k++){
    for(let j=1;j<N-1;j++) for(let i=1;i<N-1;i++){
      const idx=IX(N,i,j);
      x[idx] = (x0[idx] + a*( x[IX(N,i-1,j)]+x[IX(N,i+1,j)]+x[IX(N,i,j-1)]+x[IX(N,i,j+1)] ))/(1+4*a);
    }
    setBounds(N,x);
  }
}
function advect(N, d, d0, u, v, dt){
  for(let j=1;j<N-1;j++) for(let i=1;i<N-1;i++){
    let x=i - dt*u[IX(N,i,j)];
    let y=j - dt*v[IX(N,i,j)];
    if(x<0.5) x=0.5; if(x>N-1.5) x=N-1.5;
    if(y<0.5) y=0.5; if(y>N-1.5) y=N-1.5;
    const i0=Math.floor(x), i1=i0+1, j0=Math.floor(y), j1=j0+1;
    const s1=x-i0, s0=1-s1, t1=y-j0, t0=1-t1;
    d[IX(N,i,j)] =
      s0*(t0*d0[IX(N,i0,j0)] + t1*d0[IX(N,i0,j1)]) +
      s1*(t0*d0[IX(N,i1,j0)] + t1*d0[IX(N,i1,j1)]);
  }
  setBounds(N,d);
}
function project(N,u,v,p,div){
  for(let j=1;j<N-1;j++) for(let i=1;i<N-1;i++){
    div[IX(N,i,j)] = -0.5*( u[IX(N,i+1,j)]-u[IX(N,i-1,j)] + v[IX(N,i,j+1)]-v[IX(N,i,j-1)] )/N;
    p[IX(N,i,j)] = 0;
  }
  setBounds(N,div); setBounds(N,p);
  for(let k=0;k<50;k++){
    for(let j=1;j<N-1;j++) for(let i=1;i<N-1;i++){
      p[IX(N,i,j)] = (div[IX(N,i,j)] + p[IX(N,i-1,j)] + p[IX(N,i+1,j)] + p[IX(N,i,j-1)] + p[IX(N,i,j+1)])/4;
    }
    setBounds(N,p);
  }
  for(let j=1;j<N-1;j++) for(let i=1;i<N-1;i++){
    u[IX(N,i,j)] -= 0.5*N*(p[IX(N,i+1,j)]-p[IX(N,i-1,j)]);
    v[IX(N,i,j)] -= 0.5*N*(p[IX(N,i,j+1)]-p[IX(N,i,j-1)]);
  }
  setBounds(N,u); setBounds(N,v);
}
function setBounds(N,x){
  for(let i=1;i<N-1;i++){
    x[IX(N,i,0)]   = x[IX(N,i,1)];
    x[IX(N,i,N-1)] = x[IX(N,i,N-2)];
    x[IX(N,0,i)]   = x[IX(N,1,i)];
    x[IX(N,N-1,i)] = x[IX(N,N-2,i)];
  }
}

function step(sim, {dt,visc,diff}){
  const {N,u,v,u0,v0,d,d0}=sim;
  // diffuse velocity
  sim.u0.set(u); sim.v0.set(v);
  diffuse(N,u,u0,visc,dt); diffuse(N,v,v0,visc,dt);
  // project
  project(N,u,v,sim.u0,sim.v0);
  // advect velocity
  sim.u0.set(u); sim.v0.set(v);
  advect(N,u,u0,u0,v0,dt); advect(N,v,v0,u0,v0,dt);
  project(N,u,v,sim.u0,sim.v0);
  // dye
  diffuse(N,d,d0,diff,dt);
  sim.d0.set(d);
  advect(N,d,d0,u,v,dt);
}
function inject(sim,{force,dye}){
  const {N,u,v,d} = sim;
  const cx=N>>1, cy=N>>1;
  for(let j=-2;j<=2;j++) for(let i=-2;i<=2;i++){
    const k=IX(N,cx+i,cy+j);
    u[k]+= force*0.01*i; v[k]+= force*0.01*j;
    d[k]+= dye*0.02;
  }
}
function render(ctx, sim){
  if(!sim) return;
  const {N,d}=sim;
  const img=ctx.createImageData(N,N);
  for(let y=0;y<N;y++) for(let x=0;x<N;x++){
    const k=IX(N,x,y), v=Math.max(0, Math.min(1, d[k]));
    const R=Math.floor(50+205*v), G=Math.floor(60+195*v), B=Math.floor(255*v);
    const off=4*(y*N+x);
    img.data[off]=R; img.data[off+1]=G; img.data[off+2]=B; img.data[off+3]=255;
  }
  ctx.putImageData(img,0,0);
}
function Slider({label,v,set,min,max,step}){
  const show=(typeof v==='number'&&v.toFixed)?v.toFixed(4):v;
  return (<div className="mb-2"><label className="text-sm opacity-80">{label}: <b>{show}</b></label>
  <input className="w-full" type="range" min={min} max={max} step={step} value={v}
    onChange={e=>set(parseFloat(e.target.value))}/></div>);
}
