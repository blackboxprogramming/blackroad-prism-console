import { useMemo, useState } from "react";
import ActiveReflection from "./ActiveReflection.jsx";

/** θ' = ω,  ω' = −sinθ − γ ω + A sin(Ω t).  Strobe each drive period. */
function rk4(y, t, h, f){ const k1=f(y,t); const k2=f([y[0]+0.5*h*k1[0], y[1]+0.5*h*k1[1]], t+0.5*h);
  const k3=f([y[0]+0.5*h*k2[0], y[1]+0.5*h*k2[1]], t+0.5*h); const k4=f([y[0]+h*k3[0], y[1]+h*k3[1]], t+h);
  return [ y[0] + (h/6)*(k1[0]+2*k2[0]+2*k3[0]+k4[0]), y[1] + (h/6)*(k1[1]+2*k2[1]+2*k3[1]+k4[1]) ];
}

export default function PoincarePendulumLab(){
  const [gamma,setGamma]=useState(0.15);
  const [A,setA]=useState(1.20);
  const [Omega,setOmega]=useState(0.7);
  const [h,setH]=useState(0.01);
  const [N,setN]=useState(5000);
  const pts = useMemo(()=>{
    let t=0, y=[0.2, 0]; const data=[];
    const f=(y,t)=> [ y[1], -Math.sin(y[0]) - gamma*y[1] + A*Math.sin(Omega*t) ];
    const T=2*Math.PI/Omega; let next=T;
    for(let i=0;i<N;i++){
      y = rk4(y, t, h, f); t+=h;
      if(t>=next){ next+=T; let th=((y[0]+Math.PI)%(2*Math.PI))-Math.PI; data.push([th, y[1]]); }
    }
    return data;
  },[gamma,A,Omega,h,N]);

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">Poincaré Map — Driven, Damped Pendulum</h2>
      <Scatter pts={pts}/>
      <div className="grid" style={{gridTemplateColumns:"1fr 320px", gap:16}}>
        <div/>
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <Slider label="γ (damping)" v={gamma} set={setGamma} min={0.00} max={0.40} step={0.01}/>
          <Slider label="A (drive)" v={A} set={setA} min={0.0} max={2.0} step={0.02}/>
          <Slider label="Ω (drive freq)" v={Omega} set={setOmega} min={0.2} max={1.4} step={0.02}/>
          <Slider label="dt" v={h} set={setH} min={0.002} max={0.03} step={0.001}/>
          <Slider label="steps" v={N} set={setN} min={2000} max={20000} step={500}/>
          <ActiveReflection
            title="Active Reflection — Poincaré"
            storageKey="reflect_poincare"
            prompts={[
              "Low damping + moderate drive: islands & chaos appear.",
              "Tune Ω near 1: resonant tongues change the map.",
              "Reduce dt: points align tighter on invariant sets."
            ]}
          />
        </section>
      </div>
    </div>
  );
}

function Scatter({pts}){
  const W=640,H=360,pad=20;
  const xs=pts.map(p=>p[0]), ys=pts.map(p=>p[1]);
  const minX=-Math.PI, maxX=Math.PI;
  const minY=Math.min(...ys, -3), maxY=Math.max(...ys, 3);
  const X=x=> pad+(x-minX)/(maxX-minX)*(W-2*pad);
  const Y=y=> H-pad-(y-minY)/(maxY-minY+1e-9)*(H-2*pad);
  return (
    <section className="p-3 rounded-lg bg-white/5 border border-white/10">
      <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
        {pts.map((p,i)=><circle key={i} cx={X(p[0])} cy={Y(p[1])} r="2"/>)}
        <text x={pad} y={14} fontSize="10">θ mod 2π (x) vs ω (y) — stroboscopic samples</text>
      </svg>
    </section>
  );
}
function Slider({label,v,set,min,max,step}){ const show=(typeof v==="number"&&v.toFixed)?v.toFixed(3):v;
  return (<div className="mb-2"><label className="text-sm opacity-80">{label}: <b>{show}</b></label>
          <input className="w-full" type="range" min={min} max={max} step={step}
                 value={v} onChange={e=>set(parseFloat(e.target.value))}/></div>);
}
