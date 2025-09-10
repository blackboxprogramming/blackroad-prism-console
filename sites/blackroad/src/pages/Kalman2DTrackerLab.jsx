import { useEffect, useMemo, useRef, useState } from "react";
import ActiveReflection from "./ActiveReflection.jsx";

/** Constant-velocity model, piecewise turn maneuvers.  z_k = [x,y] + noise.
 *  State x=[px, py, vx, vy].  KF equations in 2-D.
 */
export default function Kalman2DTrackerLab(){
  const [T,setT]=useState(800);
  const [dt,setDT]=useState(0.1);
  const [q,setQ]=useState(0.05);     // process noise spectral density
  const [r,setR]=useState(2.0);      // measurement noise std
  const [seed,setSeed]=useState(7);

  const sim = useMemo(()=> simulate(T,dt,seed),[T,dt,seed]);
  const filt= useMemo(()=> kalmanFilter(sim, dt, q, r),[sim,dt,q,r]);

  const W=640,H=360;
  const cnv=useRef(null);
  useEffect(()=>{
    const c=cnv.current; if(!c) return; c.width=W; c.height=H;
    const ctx=c.getContext("2d",{alpha:false});
    draw(ctx,W,H,sim,filt);
  },[sim,filt,W,H]);

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">Kalman 2-D Tracker — Maneuvers</h2>
      <canvas ref={cnv} style={{width:"100%"}}/>
      <div className="grid" style={{gridTemplateColumns:"1fr 360px", gap:16}}>
        <div/>
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <Slider label="steps T" v={T} set={setT} min={200} max={2000} step={50}/>
          <Slider label="dt" v={dt} set={setDT} min={0.02} max={0.2} step={0.01}/>
          <Slider label="process q" v={q} set={setQ} min={0.001} max={0.2} step={0.001}/>
          <Slider label="meas std r" v={r} set={setR} min={0.2} max={5} step={0.1}/>
          <Slider label="seed" v={seed} set={setSeed} min={1} max={9999} step={1}/>
          <ActiveReflection
            title="Active Reflection — Kalman 2-D"
            storageKey="reflect_kf2d"
            prompts={[
              "Lower r → filter trusts measurements (noisier estimate).",
              "Higher q → filter allows more maneuvering; watch lag drop.",
              "During turns, CV model lags; tune q to reduce bias."
            ]}
          />
        </section>
      </div>
    </div>
  );
}

function simulate(T,dt,seed){
  let s=seed|0; const R=()=> (s=(1664525*s+1013904223)>>>0)/2**32;
  const truth=[], meas=[];
  let px=80, py=180, v=50; let ang=0;
  for(let k=0;k<T;k++){
    if(k%120===0 && k>0) ang += (R()<0.5?1:-1)*0.6; // occasional turn
    px += v*dt*Math.cos(ang); py += v*dt*Math.sin(ang);
    truth.push([px,py]);
    const zx=px +  rnorm(R,2.0), zy=py + rnorm(R,2.0);
    meas.push([zx,zy]);
  }
  return {truth, meas};
}
function rnorm(R,std){ const u=Math.max(R(),1e-12), v=Math.max(R(),1e-12); return std*Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); }

function kalmanFilter(sim,dt,q,r){
  const F=[[1,0,dt,0],[0,1,0,dt],[0,0,1,0],[0,0,0,1]];
  const H=[[1,0,0,0],[0,1,0,0]];
  const G=[[0.5*dt*dt,0],[0,0.5*dt*dt],[dt,0],[0,dt]];
  const Q = mul(G, mul([[q,0],[0,q]], T(G)));      // process cov
  const Rm=[[r*r,0],[0,r*r]];
  let x=[sim.meas[0][0], sim.meas[0][1], 0, 0];    // init at first measurement
  let P= eye(4,1e3);
  const est=[];

  for(let k=0;k<sim.meas.length;k++){
    // predict
    x = vecAdd( mulVec(F,x), [0,0,0,0] );
    P = add( mul(F, mul(P, T(F))), Q );
    // update
    const z = sim.meas[k];
    const y = vecSub( z, mulVec(H,x) );
    const S = add( mul(H, mul(P, T(H))), Rm );
    const K = mul( mul(P, T(H)), inv2(S) );
    x = vecAdd( x, mulVec(K, y) );
    P = mul( add( eye(4), scale( mul(K,H), -1)), P );
    est.push([x[0],x[1]]);
  }
  return {est};
}

function eye(n,s=1){ const I=Array.from({length:n},()=>Array(n).fill(0)); for(let i=0;i<n;i++) I[i][i]=s; return I; }
function add(A,B){ return A.map((r,i)=> r.map((v,j)=> v+B[i][j])); }
function scale(A,s){ return A.map(r=>r.map(v=>v*s)); }
function mul(A,B){ const m=A.length,n=A[0].length,p=B[0].length; const C=Array.from({length:m},()=>Array(p).fill(0));
  for(let i=0;i<m;i++) for(let k=0;k<n;k++) for(let j=0;j<p;j++) C[i][j]+=A[i][k]*B[k][j]; return C; }
function mulVec(A,v){ const m=A.length,n=A[0].length; const w=new Array(m).fill(0); for(let i=0;i<m;i++) for(let j=0;j<n;j++) w[i]+=A[i][j]*v[j]; return w; }
function T(A){ const m=A.length,n=A[0].length; const B=Array.from({length:n},()=>Array(m).fill(0)); for(let i=0;i<m;i++) for(let j=0;j<n;j++) B[j][i]=A[i][j]; return B; }
function vecAdd(a,b){ return a.map((v,i)=> v+(b[i]||0)); }
function vecSub(a,b){ return a.map((v,i)=> v-(b[i]||0)); }
function inv2(A){ // 2x2
  const [a,b,c,d]=[A[0][0],A[0][1],A[1][0],A[1][1]]; const det=a*d-b*c || 1e-12;
  return [[ d/det, -b/det],[-c/det, a/det]];
}

function draw(ctx,W,H,sim,filt){
  ctx.fillStyle="rgb(10,12,18)"; ctx.fillRect(0,0,W,H);
  // truth
  ctx.strokeStyle="#8dff8d"; ctx.lineWidth=2; ctx.beginPath();
  sim.truth.forEach(([x,y],i)=> i?ctx.lineTo(x,y):ctx.moveTo(x,y)); ctx.stroke();
  // measurements
  ctx.fillStyle="rgba(255,122,122,0.5)";
  for(const [x,y] of sim.meas){ ctx.beginPath(); ctx.arc(x,y,2,0,Math.PI*2); ctx.fill(); }
  // estimate
  ctx.strokeStyle="#79b6ff"; ctx.lineWidth=2; ctx.beginPath();
  filt.est.forEach(([x,y],i)=> i?ctx.lineTo(x,y):ctx.moveTo(x,y)); ctx.stroke();
}
function Slider({label,v,set,min,max,step}){ const show=(typeof v==="number"&&v.toFixed)?v.toFixed(2):v;
  return (<div className="mb-2"><label className="text-sm opacity-80">{label}: <b>{show}</b></label>
    <input className="w-full" type="range" min={min} max={max} step={step}
      value={v} onChange={e=>set(parseFloat(e.target.value))}/></div>);
}
