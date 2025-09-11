import { useEffect, useMemo, useRef, useState } from "react";
import ActiveReflection from "./ActiveReflection.jsx";

function f([th,p]){ return [p, -Math.sin(th)]; }
function rk4(y,h){ const k1=f(y); const k2=f([y[0]+0.5*h*k1[0], y[1]+0.5*h*k1[1]]);
  const k3=f([y[0]+0.5*h*k2[0], y[1]+0.5*h*k2[1]]); const k4=f([y[0]+h*k3[0], y[1]+h*k3[1]]);
  return [ y[0] + (h/6)*(k1[0]+2*k2[0]+2*k3[0]+k4[0]), y[1] + (h/6)*(k1[1]+2*k2[1]+2*k3[1]+k4[1]) ];
}
function energy([th,p]){ return 0.5*p*p + (1 - Math.cos(th)); }

export default function PendulumLab(){
  const [h,setH]=useState(0.02);
  const [steps,setSteps]=useState(3000);
  const [th0,setTh0]=useState(0.6), [p0,setP0]=useState(0.0);

  const traj = useMemo(()=>{
    let y=[th0,p0]; const pts=[y];
    for(let k=0;k<steps;k++){ y=rk4(y,h); // wrap θ
      y=[( (y[0]+Math.PI) % (2*Math.PI) ) - Math.PI, y[1]]; pts.push(y);
    }
    return pts;
  },[h,steps,th0,p0]);

  const portrait = useMemo(()=> gridField(), []);
  const Hsep = 2; // draw a couple of separatrix curves

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">Hamiltonian Pendulum — Phase Portrait</h2>
      <PhasePlot traj={traj} field={portrait}/>
      <div className="grid" style={{gridTemplateColumns:'1fr 320px', gap:16}}>
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <Slider label="step h" v={h} set={setH} min={0.002} max={0.05} step={0.001}/>
          <Slider label="steps" v={steps} set={setSteps} min={500} max={10000} step={100}/>
          <Slider label="θ₀" v={th0} set={setTh0} min={-Math.PI} max={Math.PI} step={0.01}/>
          <Slider label="p₀" v={p0} set={setP0} min={-2.5} max={2.5} step={0.01}/>
          <p className="text-sm mt-1">Energy H ≈ <b>{energy([th0,p0]).toFixed(3)}</b></p>
        </section>
        <ActiveReflection
          title="Active Reflection — Pendulum"
          storageKey="reflect_pendulum"
          prompts={[
            "Move (θ₀,p₀): can you find librations (inside separatrix) vs rotations (outside)?",
            "Decrease h: does numeric drift in energy shrink?",
            "What symmetries do you see in the portrait?"
          ]}
        />
      </div>
    </div>
  );
}

function gridField(){
  const N=28; const xs=Array.from({length:N},(_,i)=> -Math.PI + 2*Math.PI*i/(N-1));
  const ps=Array.from({length:N},(_,i)=> -2.5 + 5*i/(N-1));
  const segs=[];
  for(const th of xs){
    for(const p of ps){
      const y0=[th,p]; let y=y0; const K=25, h=0.03;
      const pts=[y0];
      for(let k=0;k<K;k++){ y=rk4(y,h); y=[( (y[0]+Math.PI)%(2*Math.PI) ) - Math.PI, y[1]]; pts.push(y); }
      segs.push(pts);
    }
  }
  return segs;
}
function PhasePlot({traj, field}){
  const W=640,H=360,pad=14;
  const X=th=> pad + (th+Math.PI)/(2*Math.PI)*(W-2*pad);
  const Y=p => H-pad - (p+2.5)/5*(H-2*pad);
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
      <rect x="0" y="0" width={W} height={H} fill="none"/>
      {field.map((seg,i)=>(<polyline key={i} points={seg.map(([th,p])=>`${X(th)},${Y(p)}`).join(' ')} fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.35"/>))}
      <polyline points={traj.map(([th,p])=>`${X(th)},${Y(p)}`).join(' ')} fill="none" stroke="currentColor" strokeWidth="2"/>
      <text x={pad} y={14} fontSize="10">Phase space (θ, p)</text>
    </svg>
  );
}
function Slider({label,v,set,min,max,step}){
  const show=(typeof v==='number'&&v.toFixed)?v.toFixed(3):v;
  return (<div className="mb-2"><label className="text-sm opacity-80">{label}: <b>{show}</b></label>
    <input className="w-full" type="range" min={min} max={max} step={step}
      value={v} onChange={e=>set(parseFloat(e.target.value))}/></div>);
}
