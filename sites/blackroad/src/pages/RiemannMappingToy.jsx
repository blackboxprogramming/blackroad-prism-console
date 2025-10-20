import { useEffect, useMemo, useRef, useState } from "react";
import ActiveReflection from "./ActiveReflection.jsx";

function polar(x,y){ const r=Math.hypot(x,y), t=Math.atan2(y,x); return [r,t]; }
function fromPolar(r,t){ return [r*Math.cos(t), r*Math.sin(t)]; }

// boundary map: radius r(θ) = 1 + eps * cos(n θ)
function boundaryMap(theta, eps, n){
  const r = 1 + eps*Math.cos(n*theta);
  return fromPolar(r, theta);
}

export default function RiemannMappingToy(){
  const [N,setN]=useState(82);        // grid size (odd → center point)
  const [eps,setEps]=useState(0.22);  // boundary perturbation strength
  const [mode,setMode]=useState(5);   // n in cos(nθ)
  const [iters,setIters]=useState(8000);
  const [levels,setLevels]=useState(10); // how many isolines of “radius”

  const {U,V,mask} = useMemo(()=>solveHarmonicDisk(N, eps, mode, iters), [N,eps,mode,iters]);

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">Riemann Mapping (Toy) — harmonic extension on the disk</h2>
      <MappedGrid U={U} V={V} mask={mask} levels={levels}/>
      <div className="grid" style={{gridTemplateColumns:"1fr 320px", gap:16}}>
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <Slider label="grid N" v={N} set={setN} min={41} max={121} step={2}/>
          <Slider label="ε (boundary wiggle)" v={eps} set={setEps} min={0.00} max={0.40} step={0.01}/>
          <Slider label="n (mode)" v={mode} set={setMode} min={2} max={12} step={1}/>
          <Slider label="Gauss–Seidel iters" v={iters} set={setIters} min={1000} max={20000} step={500}/>
          <Slider label="grid lines" v={levels} set={setLevels} min={6} max={24} step={1}/>
        </section>
        <ActiveReflection
          title="Active Reflection — Riemann toy"
          storageKey="reflect_riemann"
          prompts={[
            "Increase ε: which interior grid lines get pulled most toward boundary bulges?",
            "Change mode n: how many ‘petals’ appear and how do they influence interior?",
            "Raise iterations: what stabilizes first? what continues to refine slowly?"
          ]}
        />
      </div>
    </div>
  );
}

// ----- solver -----
function solveHarmonicDisk(N, eps, nMode, iters){
  const U = Array.from({length:N},()=>Array(N).fill(0)); // maps (x,y)->(u,v)
  const V = Array.from({length:N},()=>Array(N).fill(0));
  const mask = Array.from({length:N},()=>Array(N).fill(false)); // true if inside disk

  // unit square [-1,1]^2
  const toCoord = i => -1 + 2*i/(N-1);

  // initialize mask + boundary conditions
  for(let i=0;i<N;i++){
    for(let j=0;j<N;j++){
      const x = toCoord(j), y = toCoord(i);
      const r = Math.hypot(x,y);
      if(r <= 1+1e-12){
        mask[i][j] = true;
        // on boundary: set mapped boundary position
        if(Math.abs(r-1) < (2/(N-1))*1.01){
          const theta = Math.atan2(y,x);
          const [bx,by] = boundaryMap(theta, eps, nMode);
          U[i][j] = bx;
          V[i][j] = by;
        }else{
          // interior: start with identity (soft start)
          U[i][j] = x; V[i][j] = y;
        }
      }
    }
  }

  // Gauss–Seidel Laplace solve for U and V with fixed boundary
  for(let k=0;k<iters;k++){
    for(let i=1;i<N-1;i++){
      for(let j=1;j<N-1;j++){
        if(!mask[i][j]) continue;
        // skip boundary ring (keep fixed)
        const x = toCoord(j), y = toCoord(i);
        const r = Math.hypot(x,y);
        if(Math.abs(r-1) < (2/(N-1))*1.01) continue;

        // 5-point Laplacian averaging
        U[i][j] = 0.25*(U[i-1][j] + U[i+1][j] + U[i][j-1] + U[i][j+1]);
        V[i][j] = 0.25*(V[i-1][j] + V[i+1][j] + V[i][j-1] + V[i][j+1]);
      }
    }
  }
  return {U,V,mask};
}

// ----- draw mapped grid -----
function MappedGrid({U,V,mask,levels=12}){
  const W=640, H=640, pad=12;
  // gather bounds of mapped region to autoscale
  const pts=[];
  for(let i=0;i<U.length;i++) for(let j=0;j<U.length;j++){
    if(mask[i][j]) pts.push([U[i][j], V[i][j]]);
  }
  const xs=pts.map(p=>p[0]), ys=pts.map(p=>p[1]);
  const minX=Math.min(...xs), maxX=Math.max(...xs);
  const minY=Math.min(...ys), maxY=Math.max(...ys);
  const X=x=> pad + (x-minX)/(maxX-minX+1e-9)*(W-2*pad);
  const Y=y=> H-pad - (y-minY)/(maxY-minY+1e-9)*(H-2*pad);

  // radial/angle isolines in parameter disk
  const N=U.length;
  const rings=[...Array(levels).keys()].map(k=> (k+1)/(levels+1)); // radii in (0,1)
  const rays=[...Array(levels).keys()].map(k=> k*(2*Math.PI/levels));

  const ringPolys = rings.map(r=>{
    const poly=[];
    for(let t=0;t<=360;t++){
      const th = t*(Math.PI/180);
      const x = r*Math.cos(th), y=r*Math.sin(th);
      // find nearest grid cell (simple nearest)
      const i = Math.round((y+1)*(N-1)/2), j = Math.round((x+1)*(N-1)/2);
      if(i>=0&&i<N&&j>=0&&j<N&&mask[i][j]) poly.push([U[i][j], V[i][j]]);
    }
    return poly;
  });
  const rayPolys = rays.map(th=>{
    const poly=[];
    for(let s=0;s<=200;s++){
      const r = s/200;
      const x = r*Math.cos(th), y=r*Math.sin(th);
      const i = Math.round((y+1)*(N-1)/2), j = Math.round((x+1)*(N-1)/2);
      if(i>=0&&i<N&&j>=0&&j<N&&mask[i][j]) poly.push([U[i][j], V[i][j]]);
    }
    return poly;
  });

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
      <rect x="0" y="0" width={W} height={H} fill="none"/>
      {ringPolys.map((poly,idx)=>
        <polyline key={`r${idx}`} points={poly.map(p=>`${X(p[0])},${Y(p[1])}`).join(" ")} fill="none" strokeWidth="1"/>
      )}
      {rayPolys.map((poly,idx)=>
        <polyline key={`t${idx}`} points={poly.map(p=>`${X(p[0])},${Y(p[1])}`).join(" ")} fill="none" strokeWidth="1"/>
      )}
    </svg>
  );
}

function Slider({label,v,set,min,max,step}){
  const show = (typeof v==="number"&&v.toFixed) ? v.toFixed(3) : v;
  return (<div className="mb-2"><label className="text-sm opacity-80">{label}: <b>{show}</b></label>
    <input className="w-full" type="range" min={min} max={max} step={step}
      value={v} onChange={e=>set(parseFloat(e.target.value))}/></div>);
}
