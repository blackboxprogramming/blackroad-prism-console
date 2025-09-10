import { useEffect, useMemo, useRef, useState } from "react";
import ActiveReflection from "./ActiveReflection.jsx";

/** Incompressible 2-D:
 *   ω_t + u·∇ω = ν ∇²ω
 *   ∇²ψ = −ω,  u = (ψ_y, −ψ_x)
 * Semi-Lagrangian advection + Gauss–Seidel Poisson solve for ψ.
 */
function clamp(a,l,h){ return a<l?l : a>h?h : a; }
function idx(N,x,y){ return (y*N + x); }

export default function VorticityStreamLab(){
  const [N,setN]=useState(128);
  const [nu,setNu]=useState(0.0008);
  const [dt,setDT]=useState(0.8);
  const [running,setRun]=useState(true);

  const sim=useMemo(()=> init(N),[N]);

  const cnv=useRef(null);
  useEffect(()=>{
    const c=cnv.current; if(!c) return; c.width=N; c.height=N;
    const ctx=c.getContext("2d",{alpha:false});
    let raf;
    const loop=()=>{
      if(running){ step(sim, dt, nu); }
      render(ctx, sim);
      raf=requestAnimationFrame(loop);
    };
    loop(); return ()=> cancelAnimationFrame(raf);
  },[sim,dt,nu,running,N]);

  // inject vortex on click
  useEffect(()=>{
    const c=cnv.current; if(!c) return; const rect=()=>c.getBoundingClientRect();
    const add=(e)=>{
      const x=clamp(Math.floor((e.clientX-rect().left)/rect().width*N),1,N-2);
      const y=clamp(Math.floor((e.clientY-rect().top )/rect().height*N),1,N-2);
      inject(sim,x,y, 60*(e.shiftKey? -1: +1));
    };
    c.addEventListener("mousedown",add); return ()=> c.removeEventListener("mousedown",add);
  },[sim,N]);

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">Navier–Stokes — Vorticity & Streamfunction</h2>
      <canvas ref={cnv} style={{width:"100%", imageRendering:"pixelated"}}/>
      <div className="grid" style={{gridTemplateColumns:"1fr 360px", gap:16}}>
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <button className="px-2 py-1 rounded bg-white/10 border border-white/10" onClick={()=>setRun(r=>!r)}>{running?"Pause":"Run"}</button>
          <button className="ml-2 px-2 py-1 rounded bg-white/10 border border-white/10" onClick={()=>reset(sim)}>Reset</button>
        </section>
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <Slider label="grid N" v={N} set={setN} min={96} max={192} step={16}/>
          <Slider label="ν (viscosity)" v={nu} set={setNu} min={0.0002} max={0.002} step={0.0001}/>
          <Slider label="dt" v={dt} set={setDT} min={0.2} max={1.2} step={0.05}/>
          <ActiveReflection
            title="Active Reflection — Vorticity–Stream"
            storageKey="reflect_vorticity"
            prompts={[
              "Shift-click injects counter-rotating vortex; watch pairing.",
              "Lower ν → longer-lived vortices; higher ν diffuses quickly.",
              "Semi-Lagrangian advection is unconditionally stable but diffusive."
            ]}
          />
        </section>
      </div>
    </div>
  );
}

function init(N){
  return {
    N,
    w: new Float32Array(N*N),         // vorticity
    psi: new Float32Array(N*N),       // streamfunction
    u: new Float32Array(N*N),         // u = +psi_y
    v: new Float32Array(N*N),         // v = -psi_x
    tmp: new Float32Array(N*N)
  };
}
function reset(sim){ sim.w.fill(0); sim.psi.fill(0); sim.u.fill(0); sim.v.fill(0); }
function inject(sim,x,y,str){ // add compact vorticity blob
  const {N,w}=sim; const r=N/24;
  for(let j=-r;j<=r;j++) for(let i=-r;i<=r;i++){
    const X=clamp(x+i,1,N-2), Y=clamp(y+j,1,N-2);
    const d=i*i+j*j; if(d>r*r) continue;
    w[idx(N,X,Y)] += str*Math.exp(-d/(r*0.6));
  }
}
function laplacian(N,A,i,j){
  return A[idx(N,i-1,j)] + A[idx(N,i+1,j)] + A[idx(N,i,j-1)] + A[idx(N,i,j+1)] - 4*A[idx(N,i,j)];
}
function solvePoisson(sim){ // ∇²ψ = −ω with Gauss–Seidel
  const {N,psi,w}=sim;
  for(let it=0; it<60; it++){
    for(let j=1;j<N-1;j++) for(let i=1;i<N-1;i++){
      psi[idx(N,i,j)] = 0.25*( psi[idx(N,i-1,j)] + psi[idx(N,i+1,j)] + psi[idx(N,i,j-1)] + psi[idx(N,i,j+1)] + w[idx(N,i,j)] );
    }
  }
}
function velocity(sim){
  const {N,psi,u,v}=sim;
  for(let j=1;j<N-1;j++) for(let i=1;i<N-1;i++){
    u[idx(N,i,j)] = (psi[idx(N,i,j+1)] - psi[idx(N,i,j-1)])*0.5;
    v[idx(N,i,j)] = -(psi[idx(N,i+1,j)] - psi[idx(N,i-1,j)])*0.5;
  }
}
function advect(sim,dt){
  const {N,w,u,v,tmp}=sim;
  for(let j=1;j<N-1;j++) for(let i=1;i<N-1;i++){
    const x=i - dt*u[idx(N,i,j)], y=j - dt*v[idx(N,i,j)];
    const i0=clamp(Math.floor(x),1,N-2), j0=clamp(Math.floor(y),1,N-2);
    const fx=x-i0, fy=y-j0;
    const w00=w[idx(N,i0,j0)], w10=w[idx(N,i0+1,j0)], w01=w[idx(N,i0,j0+1)], w11=w[idx(N,i0+1,j0+1)];
    tmp[idx(N,i,j)] = (1-fx)*(1-fy)*w00 + fx*(1-fy)*w10 + (1-fx)*fy*w01 + fx*fy*w11;
  }
  w.set(tmp);
}
function diffuse(sim,dt,nu){
  const {N,w}=sim, a=nu*dt;
  for(let it=0; it<20; it++){
    for(let j=1;j<N-1;j++) for(let i=1;i<N-1;i++){
      w[idx(N,i,j)] = ( w[idx(N,i,j)] + a*( w[idx(N,i-1,j)] + w[idx(N,i+1,j)] + w[idx(N,i,j-1)] + w[idx(N,i,j+1)] ) ) / (1+4*a);
    }
  }
}
function step(sim,dt,nu){
  solvePoisson(sim);
  velocity(sim);
  advect(sim,dt);
  diffuse(sim,dt,nu);
}
function render(ctx, sim){
  const {N,w,u,v}=sim;
  const img=ctx.createImageData(N,N);
  let mn=1e9,mx=-1e9; for(let i=0;i<w.length;i++){ if(w[i]<mn) mn=w[i]; if(w[i]>mx) mx=w[i]; }
  for(let j=0;j<N;j++) for(let i=0;i<N;i++){
    const wv=(w[idx(N,i,j)]-mn)/(mx-mn+1e-9);
    const off=4*(j*N+i);
    img.data[off]=Math.floor(40+200*wv);
    img.data[off+1]=Math.floor(50+180*(1-wv));
    img.data[off+2]=Math.floor(220*(1-wv));
    img.data[off+3]=255;
  }
  ctx.putImageData(img,0,0);
  // sparse velocity arrows
  ctx.strokeStyle="#fff"; ctx.lineWidth=1;
  for(let j=8;j<N;j+=16) for(let i=8;i<N;i+=16){
    const px=i+0.5, py=j+0.5, ux=u[idx(N,i,j)], vy=v[idx(N,i,j)];
    ctx.beginPath(); ctx.moveTo(px,py); ctx.lineTo(px+ux*4, py+vy*4); ctx.stroke();
  }
}
function Slider({label,v,set,min,max,step}){ const show=(typeof v==='number'&&v.toFixed)?v.toFixed(3):v;
  return (<div className="mb-2"><label className="text-sm opacity-80">{label}: <b>{show}</b></label>
          <input className="w-full" type="range" min={min} max={max} step={step}
                 value={v} onChange={e=>set(parseFloat(e.target.value))}/></div>);
}
