import { useMemo, useState } from "react";
import ActiveReflection from "./ActiveReflection.jsx";

function rng(seed){ let s=seed|0||2025; return ()=> (s=(1664525*s+1013904223)>>>0)/2**32; }
function randn(r){ const u=Math.max(r(),1e-12), v=Math.max(r(),1e-12);
  return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); }

export default function OULab(){
  const [N,setN]=useState(800);
  const [dt,setDT]=useState(0.01);
  const [lambda,setLambda]=useState(1.2);
  const [mu,setMu]=useState(0.0);
  const [sigma,setSigma]=useState(0.7);
  const [seed,setSeed]=useState(42);

  const path = useMemo(()=>{
    const r=rng(seed); const x=[0];
    for(let k=1;k<N;k++){
      const xk = x[k-1] + (-lambda*(x[k-1]-mu))*dt + sigma*Math.sqrt(dt)*randn(r);
      x.push(xk);
    }
    return x;
  },[N,dt,lambda,mu,sigma,seed]);

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">Ornstein–Uhlenbeck SDE — mean reversion</h2>
      <Series path={path}/>
      <div className="grid" style={{gridTemplateColumns:"1fr 320px", gap:16}}>
        <Hist data={path}/>
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <Slider label="steps" v={N} set={setN} min={200} max={3000} step={50}/>
          <Slider label="dt" v={dt} set={setDT} min={0.001} max={0.05} step={0.001}/>
          <Slider label="λ (reversion)" v={lambda} set={setLambda} min={0.1} max={3.0} step={0.05}/>
          <Slider label="μ (target)" v={mu} set={setMu} min={-2} max={2} step={0.01}/>
          <Slider label="σ (noise)" v={sigma} set={setSigma} min={0.1} max={2.0} step={0.01}/>
          <Slider label="seed" v={seed} set={setSeed} min={1} max={9999} step={1}/>
          <ActiveReflection
            title="Active Reflection — OU"
            storageKey="reflect_ou"
            prompts={[
              "Increase λ: does the process ‘snap’ back faster to μ?",
              "Change σ: histogram variance should scale like σ²/(2λ) at stationarity.",
              "Decrease dt: does the path look smoother and the histogram stabilize?"
            ]}
          />
        </section>
      </div>
    </div>
  );
}

function Series({path}){
  const W=640,H=220,pad=12; const N=path.length;
  const minY=Math.min(...path), maxY=Math.max(...path);
  const X=i=> pad + (i/(N-1))*(W-2*pad);
  const Y=v=> H-pad - ((v-minY)/(maxY-minY+1e-9))*(H-2*pad);
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
      <rect x="0" y="0" width={W} height={H} fill="none"/>
      {path.map((v,i)=> {
        const x1=i?X(i-1):X(i), y1=i?Y(path[i-1]):Y(v);
        const x2=X(i), y2=Y(v);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth="2"/>;
      })}
    </svg>
  );
}
function Hist({data}){
  const W=320,H=220,pad=10, bins=50;
  const mn=Math.min(...data), mx=Math.max(...data);
  const Hs=Array(bins).fill(0);
  for(const x of data){
    const k = Math.min(bins-1, Math.max(0, Math.floor((x-mn)/Math.max(1e-9,mx-mn)*bins)));
    Hs[k]+=1;
  }
  const total=Hs.reduce((a,b)=>a+b,0)||1;
  const probs=Hs.map(x=>x/total);
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
      {probs.map((p,i)=>{
        const x=pad + i*((W-2*pad)/bins), w=(W-2*pad)/bins*0.95;
        const h=(H-2*pad)*p;
        return <rect key={i} x={x} y={H-pad-h} width={w} height={h} rx="2" ry="2"/>;
      })}
    </svg>
  );
}
function Slider({label,v,set,min,max,step}){
  const show=(typeof v==="number"&&v.toFixed)?v.toFixed(3):v;
  return (<div className="mb-2"><label className="text-sm opacity-80">{label}: <b>{show}</b></label>
    <input className="w-full" type="range" min={min} max={max} step={step}
      value={v} onChange={e=>set(parseFloat(e.target.value))}/></div>);
}
