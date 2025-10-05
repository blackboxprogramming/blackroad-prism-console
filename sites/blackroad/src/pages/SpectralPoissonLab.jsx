import { useMemo, useState } from "react";
import ActiveReflection from "./ActiveReflection.jsx";

/** Periodic Poisson: on N×N grid, solve ∇²u = f using FFT.
 *  We use DFT by direct O(N^2) (small N) to avoid deps. Also show a few Laplacian eigenmodes.
 */
function dft2D(a){
  const N=a.length, M=a[0].length;
  const Re=Array.from({length:N},()=>Array(M).fill(0));
  const Im=Array.from({length:N},()=>Array(M).fill(0));
  for(let k=0;k<N;k++){
    for(let l=0;l<M;l++){
      let r=0,i=0;
      for(let x=0;x<N;x++) for(let y=0;y<M;y++){
        const ang=-2*Math.PI*(k*x/N + l*y/M);
        const c=Math.cos(ang), s=Math.sin(ang);
        r += a[x][y]*c; i += a[x][y]*s;
      }
      Re[k][l]=r; Im[k][l]=i;
    }
  }
  return {Re,Im};
}
function idft2D(Re,Im){
  const N=Re.length, M=Re[0].length;
  const a=Array.from({length:N},()=>Array(M).fill(0));
  for(let x=0;x<N;x++){
    for(let y=0;y<M;y++){
      let r=0;
      for(let k=0;k<N;k++) for(let l=0;l<M;l++){
        const ang=2*Math.PI*(k*x/N + l*y/M);
        r += Re[k][l]*Math.cos(ang) - Im[k][l]*Math.sin(ang);
      }
      a[x][y]= r/(N*M);
    }
  }
  return a;
}
function solvePoisson(f){
  const N=f.length, M=f[0].length;
  const {Re,Im}=dft2D(f);
  const URe=Array.from({length:N},()=>Array(M).fill(0));
  const UIm=Array.from({length:N},()=>Array(M).fill(0));
  for(let k=0;k<N;k++){
    const kx = k<=N/2 ? k : k-N; // wrap negative frequencies
    for(let l=0;l<M;l++){
      const ky = l<=M/2 ? l : l-M;
      const lambda = -(kx*kx + ky*ky); // periodic Laplacian eigenvalue in physical coords
      if(lambda===0){ URe[k][l]=0; UIm[k][l]=0; } // remove mean (compatibility)
      else {
        URe[k][l] = Re[k][l]/lambda;
        UIm[k][l] = Im[k][l]/lambda;
      }
    }
  }
  return idft2D(URe, UIm);
}
function makeF(N, kind, a, b){
  const f=Array.from({length:N},()=>Array(N).fill(0));
  for(let x=0;x<N;x++) for(let y=0;y<N;y++){
    const X=2*Math.PI*x/N, Y=2*Math.PI*y/N;
    if(kind==="gauss"){
      const cx=a, cy=b, sx=0.15, sy=0.15;
      const dx=X-TAU*cx, dy=Y-TAU*cy;
      f[x][y]= Math.exp(-(dx*dx)/(2*sx*sx) - (dy*dy)/(2*sy*sy)) - 0.1*Math.exp(-(dx*dx+dy*dy)/(2*0.5*0.5));
    }else if(kind==="sin"){
      f[x][y]= Math.sin(a*X)*Math.sin(b*Y);
    }else{
      f[x][y]= 0;
    }
  }
  return f;
}
const TAU=2*Math.PI;
export default function SpectralPoissonLab(){
  const [N,setN]=useState(48);
  const [kind,setKind]=useState("gauss"); // gauss or sin
  const [a,setA]=useState(0.35), [b,setB]=useState(0.55); // centers or modes
  const [showModes,setShowModes]=useState(true);

  const f = useMemo(()=> makeF(N, kind, a, b), [N,kind,a,b]);
  const u = useMemo(()=> solvePoisson(f), [f]);

  const modes = useMemo(()=>{
    if(!showModes) return [];
    const out=[];
    for(let k=1;k<=3;k++){
      for(let l=1;l<=3;l++){
        const phi = Array.from({length:N},()=>Array(N).fill(0));
        for(let x=0;x<N;x++) for(let y=0;y<N;y++){
          const X=2*Math.PI*x/N, Y=2*Math.PI*y/N;
          phi[x][y] = Math.cos(k*X)*Math.cos(l*Y); // one family
        }
        out.push({k,l,phi});
      }
    }
    return out;
  },[N,showModes]);

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">Spectral Poisson & Eigenmodes (periodic)</h2>
      <FieldPlot A={u} title="u: solution of ∇²u = f"/>
      <div className="grid" style={{gridTemplateColumns:'1fr 320px', gap:16}}>
        <FieldPlot A={f} title="f: right-hand side"/>
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <Radio name="kind" value={kind} set={setKind} opts={[ ["gauss","Gaussian bumps"],["sin","sin(kx)sin(ly)"] ]}/>
          <Slider label={kind==="gauss"?"center a (0..1)":"k (mode)"} v={a} set={setA} min={kind==="gauss"?0:1} max={kind==="gauss"?1:8} step={kind==="gauss"?0.01:1}/>
          <Slider label={kind==="gauss"?"center b (0..1)":"l (mode)"} v={b} set={setB} min={kind==="gauss"?0:1} max={kind==="gauss"?1:8} step={kind==="gauss"?0.01:1}/>
          <Slider label="N" v={N} set={setN} min={24} max={96} step={8}/>
          <label className="text-sm flex items-center gap-2 mt-2">
            <input type="checkbox" checked={showModes} onChange={e=>setShowModes(e.target.checked)}/> show eigenmodes
          </label>
          <ActiveReflection
            title="Active Reflection — Spectral Poisson"
            storageKey="reflect_poisson"
            prompts={[
              "For sin(kx)sin(ly), does u scale by −1/λ_{kl}? (Check amplitude vs k,l.)",
              "How does removing the mean of f affect solvability on a torus?",
              "Compare u and f visually: where is u smoothest vs sharpest?"
            ]}
          />
        </section>
      </div>
      {showModes && <ModesGrid modes={modes}/>}
    </div>
  );
}
function FieldPlot({A,title}){
  const N=A.length, W=320, H=320;
  const flat=A.flat(); const mn=Math.min(...flat), mx=Math.max(...flat);
  return (
    <section className="p-3 rounded-lg bg-white/5 border border-white/10">
      <h3 className="font-semibold mb-2">{title}</h3>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
        <rect x="0" y="0" width={W} height={H} fill="none"/>
        {A.map((row,i)=> row.map((v,j)=>{
          const x=j*(W/A.length), y=i*(H/A.length);
          const t=(v-mn)/(mx-mn+1e-9);
          // pleasant palette
          const R=Math.floor(40+200*t), G=Math.floor(50+180*(1-t)), B=Math.floor(220*(1-t));
          return <rect key={`${i}-${j}`} x={x} y={y} width={W/A.length} height={H/A.length} rx="0.5" ry="0.5" style={{fill:`rgb(${R},${G},${B})`}}/>;
        }))}
      </svg>
    </section>
  );
}
function ModesGrid({modes}){
  const W=640; const cols=3; const cell=200;
  return (
    <section className="p-3 rounded-lg bg-white/5 border border-white/10">
      <h3 className="font-semibold mb-2">Laplacian eigenmodes (cos kx cos ly)</h3>
      <div className="grid" style={{gridTemplateColumns:`repeat(${cols}, ${cell}px)`, gap:12}}>
        {modes.map(({k,l,phi},idx)=> <FieldPlot key={idx} A={phi} title={`(k,l)=(${k},${l})`}/>)}
      </div>
    </section>
  );
}
function Slider({label,v,set,min,max,step}){
  const show=(typeof v==='number'&&v.toFixed)?v.toFixed(3):v;
  return (<div className="mb-2"><label className="text-sm opacity-80">{label}: <b>{show}</b></label>
    <input className="w-full" type="range" min={min} max={max} step={step}
      value={v} onChange={e=>set(parseFloat(e.target.value))}/></div>);
}
function Radio({name,value,set,opts}){
  return (<div className="flex gap-3 text-sm">
    {opts.map(([val,lab])=> <label key={val} className="flex items-center gap-1">
      <input type="radio" name={name} checked={value===val} onChange={()=>set(val)}/>{lab}
    </label>)}
  </div>);
}
