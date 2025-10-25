import { useMemo, useState } from "react";
import ActiveReflection from "./ActiveReflection.jsx";

function rng(seed){ let s=seed|0||2025; return ()=> (s=(1664525*s+1013904223)>>>0)/2**32; }
function randn(r){ const u=Math.max(r(),1e-12), v=Math.max(r(),1e-12); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); }

function twoMoons(n, seed){
  const r=rng(seed), X=[];
  for(let i=0;i<n;i++){
    const t=Math.PI*(r());
    const x=Math.cos(t), y=Math.sin(t);
    X.push([x + 0.05*randn(r), y + 0.05*randn(r)]);
  }
  for(let i=0;i<n;i++){
    const t=Math.PI*(r());
    const x=1 - Math.cos(t), y=-0.5 - Math.sin(t);
    X.push([x + 0.05*randn(r), y + 0.05*randn(r)]);
  }
  return X; // 2n points
}
function kernelMarkov(X, sigma){
  const n=X.length, P=Array.from({length:n},()=>Array(n).fill(0));
  const row=Array(n).fill(0);
  for(let i=0;i<n;i++){
    for(let j=0;j<n;j++){
      const dx=X[i][0]-X[j][0], dy=X[i][1]-X[j][1];
      const w=Math.exp(-(dx*dx+dy*dy)/(2*sigma*sigma));
      P[i][j]=w; row[i]+=w;
    }
  }
  for(let i=0;i<n;i++){ const s=row[i]||1; for(let j=0;j<n;j++) P[i][j]/=s; }
  return P;
}
function topEigenvectors(P, k){
  const n=P.length;
  const mult = (v)=>{ const y=Array(n).fill(0); for(let i=0;i<n;i++) for(let j=0;j<n;j++) y[i]+=P[i][j]*v[j]; return y; };
  const vecs=[], vals=[];
  // simple power iteration with deflation
  for(let m=0;m<k;m++){
    let v=Array(n).fill(0).map(()=>Math.random()*2-1);
    // GS against earlier
    const orth = (u)=>{ for(let q=0;q<vecs.length;q++){ const dot=u.reduce((s,x,i)=>s+x*vecs[q][i],0); for(let i=0;i<n;i++) u[i]-=dot*vecs[q][i]; } return u; };
    v=orth(v); let lam=0;
    for(let t=0;t<120;t++){
      let y=mult(v); y=orth(y);
      const norm=Math.sqrt(y.reduce((s,x)=>s+x*x,0))||1; for(let i=0;i<n;i++) y[i]/=norm;
      v=y; const Pv=mult(v); lam = v.reduce((s,x,i)=> s + x*Pv[i], 0);
    }
    vecs.push(v); vals.push(lam);
  }
  return {vecs, vals};
}

export default function DiffusionMapsLab(){
  const [n,setN]=useState(200);
  const [sigma,setSigma]=useState(0.2);
  const [time,setTime]=useState(1.0);
  const [seed,setSeed]=useState(7);

  const X = useMemo(()=> twoMoons(n, seed),[n,seed]);
  const P = useMemo(()=> kernelMarkov(X, sigma),[X,sigma]);
  const {vecs, vals} = useMemo(()=> topEigenvectors(P, 3),[P]); // vecs[0] ≈ trivial
  const coords = useMemo(()=>{
    if(vecs.length<3) return [];
    const phi1=vecs[1], phi2=vecs[2];
    const l1=Math.pow(vals[1], time), l2=Math.pow(vals[2], time);
    return X.map((_,i)=> [ l1*phi1[i], l2*phi2[i] ]);
  },[vecs,vals,time,X]);

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">Diffusion Maps — two moons</h2>
      <Scatter pts={coords}/>
      <div className="grid" style={{gridTemplateColumns:"1fr 320px", gap:16}}>
        <div/>
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <Slider label="per moon (n)" v={n} set={setN} min={100} max={600} step={20}/>
          <Slider label="σ (kernel)" v={sigma} set={setSigma} min={0.05} max={0.6} step={0.01}/>
          <Slider label="diffusion time t" v={time} set={setTime} min={0.2} max={5} step={0.1}/>
          <Slider label="seed" v={seed} set={setSeed} min={1} max={9999} step={1}/>
          <ActiveReflection
            title="Active Reflection — Diffusion Maps"
            storageKey="reflect_diffmaps"
            prompts={[
              "Small σ: local geometry preserved; when does the embedding fragment?",
              "Increase t: diffusion “blurs” short-scale detail — what stabilizes?",
              "Why does the first nontrivial eigenvector already separate the moons?"
            ]}
          />
        </section>
      </div>
    </div>
  );
}
function Scatter({pts}){
  const W=640,H=360,pad=20; if(!pts.length) return null;
  const xs=pts.map(p=>p[0]), ys=pts.map(p=>p[1]);
  const minX=Math.min(...xs), maxX=Math.max(...xs);
  const minY=Math.min(...ys), maxY=Math.max(...ys);
  const X=x=> pad+(x-minX)/(maxX-minX+1e-9)*(W-2*pad);
  const Y=y=> H-pad-(y-minY)/(maxY-minY+1e-9)*(H-2*pad);
  return (
    <section className="p-3 rounded-lg bg-white/5 border border-white/10">
      <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
        {pts.map((p,i)=><circle key={i} cx={X(p[0])} cy={Y(p[1])} r="3"/>) }
      </svg>
    </section>
  );
}
function Slider({label,v,set,min,max,step}){ const show=(typeof v==='number'&&v.toFixed)?v.toFixed(2):v;
  return (<div className="mb-2"><label className="text-sm opacity-80">{label}: <b>{show}</b></label>
  <input className="w-full" type="range" min={min} max={max} step={step}
  value={v} onChange={e=>set(parseFloat(e.target.value))}/></div>);
}

