import { useMemo, useRef, useEffect, useState } from "react";
import ActiveReflection from "./ActiveReflection.jsx";

function rng(seed){ let s=seed|0||2025; return ()=> (s=(1664525*s+1013904223)>>>0)/2**32; }
function erdosRenyi(n,p,seed){
  const R=rng(seed);
  const A=Array.from({length:n},()=>Array(n).fill(0));
  for(let i=0;i<n;i++) for(let j=i+1;j<n;j++) if(R()<p){ A[i][j]=A[j][i]=1; }
  return A;
}
function laplacian(A){
  const n=A.length; const L=Array.from({length:n},()=>Array(n).fill(0));
  for(let i=0;i<n;i++){
    let d=0; for(let j=0;j<n;j++){ if(A[i][j]) d++; }
    for(let j=0;j<n;j++){ L[i][j]=(i===j? d : -A[i][j]); }
  }
  return L;
}
// Power iteration for k smallest nontrivial eigenvectors via deflation on (I - αL)
function lapEmbed(A, k=2){
  const n=A.length, L=laplacian(A);
  const maxDeg = Math.max(...A.map(row=> row.reduce((a,b)=>a+b,0)));
  const alpha = 1/(maxDeg+1e-9);
  const M = (v)=>{ // (I - αL) v
    const y=Array(n).fill(0);
    for(let i=0;i<n;i++){
      let sum=0; for(let j=0;j<n;j++) sum += L[i][j]*v[j];
      y[i] = v[i] - alpha*sum;
    }
    // normalize
    const mean=y.reduce((a,b)=>a+b,0)/n; for(let i=0;i<n;i++) y[i]-=mean;
    const norm=Math.sqrt(y.reduce((s,x)=>s+x*x,0))||1; for(let i=0;i<n;i++) y[i]/=norm;
    return y;
  };
  const vecs=[];
  const deflate=(v)=>{ let u=v.slice(); for(const q of vecs){ const dot=u.reduce((s,x,i)=>s+x*q[i],0); for(let i=0;i<n;i++) u[i]-=dot*q[i]; }
    const norm=Math.sqrt(u.reduce((s,x)=>s+x*x,0))||1; return u.map(x=>x/norm); };
  for(let m=0;m<k+1;m++){ // +1 to skip trivial constant
    let v=Array(n).fill(0).map(()=>Math.random()*2-1); v=deflate(v);
    for(let t=0;t<160;t++) v=deflate(M(v));
    vecs.push(v);
  }
  // coords from the last k vectors (skip vecs[0])
  const X = Array.from({length:n},(_,i)=> vecs.slice(1, k+1).map(v=>v[i]));
  return X;
}
// Simple spring layout (Fruchterman–Reingold-ish)
function springLayout(A, iters=300, area=1){
  const n=A.length; const W=Math.sqrt(area);
  let P=Array.from({length:n},()=>[ (Math.random()-0.5)*W, (Math.random()-0.5)*W ]);
  const k = W/Math.sqrt(n);
  const cool = (t)=> t*0.95;
  let temp=W/2;
  for(let it=0; it<iters; it++){
    const disp=Array.from({length:n},()=>[0,0]);
    // repulsion
    for(let v=0;v<n;v++){
      for(let u=v+1;u<n;u++){
        const dx=P[v][0]-P[u][0], dy=P[v][1]-P[u][1];
        const dist=Math.hypot(dx,dy)||1e-6;
        const f = (k*k)/dist;
        const ux=f*dx/dist, uy=f*dy/dist;
        disp[v][0]+=ux; disp[v][1]+=uy; disp[u][0]-=ux; disp[u][1]-=uy;
      }
    }
    // attraction
    for(let v=0;v<n;v++) for(let u=v+1;u<n;u++) if(A[v][u]){
      const dx=P[v][0]-P[u][0], dy=P[v][1]-P[u][1];
      const dist=Math.hypot(dx,dy)||1e-6;
      const f = (dist*dist)/k;
      const ux=f*dx/dist, uy=f*dy/dist;
      disp[v][0]-=ux; disp[v][1]-=uy; disp[u][0]+=ux; disp[u][1]+=uy;
    }
    // update
    for(let v=0;v<n;v++){
      const d=Math.hypot(disp[v][0], disp[v][1])||1e-9;
      P[v][0]+= (disp[v][0]/d)*Math.min(d,temp);
      P[v][1]+= (disp[v][1]/d)*Math.min(d,temp);
    }
    temp=cool(temp);
  }
  return P;
}

export default function SpectralGraphLab(){
  const [n,setN]=useState(48);
  const [p,setP]=useState(0.08);
  const [seed,setSeed]=useState(7);
  const [iters,setIters]=useState(250);

  const A = useMemo(()=> erdosRenyi(n, p, seed),[n,p,seed]);
  const spec = useMemo(()=> lapEmbed(A, 2),[A]);
  const spring = useMemo(()=> springLayout(A, iters, 4),[A,iters]);

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">Spectral Graph Drawing — Spring vs Laplacian</h2>
      <TwoPlots A={A} left={spring} leftTitle="Spring (FR)" right={spec} rightTitle="Laplacian (eigenmaps)"/>
      <div className="grid" style={{gridTemplateColumns:"1fr 340px", gap:16}}>
        <div/>
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <Slider label="nodes n" v={n} set={setN} min={12} max={120} step={4}/>
          <Slider label="edge prob p" v={p} set={setP} min={0.02} max={0.2} step={0.01}/>
          <Slider label="spring iters" v={iters} set={setIters} min={100} max={800} step={50}/>
          <Slider label="seed" v={seed} set={setSeed} min={1} max={9999} step={1}/>
          <ActiveReflection
            title="Active Reflection — Spectral Graphs"
            storageKey="reflect_spectral_graph"
            prompts={[
              "Where do hubs move between layouts?",
              "Which layout preserves community structure more clearly?",
              "Increase p: when does the Laplacian view compress into a blob?"
            ]}
          />
        </section>
      </div>
    </div>
  );
}
function TwoPlots({A,left,leftTitle,right,rightTitle}){
  return (
    <div className="grid" style={{gridTemplateColumns:"1fr 1fr", gap:16}}>
      <GraphPlot A={A} P={left} title={leftTitle}/>
      <GraphPlot A={A} P={right} title={rightTitle}/>
    </div>
  );
}
function GraphPlot({A,P,title}){
  const W=640,H=360,pad=20;
  const xs=P.map(p=>p[0]), ys=P.map(p=>p[1]);
  const minX=Math.min(...xs), maxX=Math.max(...xs), minY=Math.min(...ys), maxY=Math.max(...ys);
  const X=x=> pad+(x-minX)/(maxX-minX+1e-9)*(W-2*pad);
  const Y=y=> H-pad-(y-minY)/(maxY-minY+1e-9)*(H-2*pad);
  return (
    <section className="p-3 rounded-lg bg-white/5 border border-white/10">
      <h3 className="font-semibold mb-2">{title}</h3>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
        {A.map((row,i)=> row.map((e,j)=> e && j>i ? <line key={`${i}-${j}`} x1={X(P[i][0])} y1={Y(P[i][1])} x2={X(P[j][0])} y2={Y(P[j][1])} strokeWidth="1" opacity="0.35"/> : null))}
        {P.map((p,i)=> <circle key={i} cx={X(p[0])} cy={Y(p[1])} r="4"/>) }
      </svg>
    </section>
  );
}
function Slider({label,v,set,min,max,step}){ const show=(typeof v==='number'&&v.toFixed)?v.toFixed(2):v;
  return (<div className="mb-2"><label className="text-sm opacity-80">{label}: <b>{show}</b></label>
    <input className="w-full" type="range" min={min} max={max} step={step}
      value={v} onChange={e=>set(parseFloat(e.target.value))}/></div>);
}
