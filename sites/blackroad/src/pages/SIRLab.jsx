import { useMemo, useState } from "react";
import ActiveReflection from "./ActiveReflection.jsx";

/** dS/dt = -β S I,  dI/dt = β S I - γ I,  dR/dt = γ I.  Normalize S+I+R=1 */
function stepSIR([S,I,R], beta, gamma, h){
  const dS = -beta*S*I;
  const dI = beta*S*I - gamma*I;
  const dR = gamma*I;
  S += h*dS; I += h*dI; R += h*dR;
  const s=S+I+R; return [S/s, I/s, R/s];
}

export default function SIRLab(){
  const [beta,setBeta]=useState(0.9);
  const [gamma,setGamma]=useState(0.3);
  const [I0,setI0]=useState(0.02);
  const [h,setH]=useState(0.01);
  const [N,setN]=useState(1200);

  const path = useMemo(()=>{
    let S = 1 - I0, I = I0, R = 0;
    const pts=[[S,I,R]];
    for(let k=0;k<N;k++){ [S,I,R]=stepSIR([S,I,R],beta,gamma,h); pts.push([S,I,R]); }
    return pts;
  },[beta,gamma,I0,h,N]);

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">SIR — ODE Playground</h2>
      <div className="grid" style={{gridTemplateColumns:'1fr 320px', gap:16}}>
        <Series path={path}/>
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <Slider label="β (infection)" v={beta} set={setBeta} min={0.05} max={2.0} step={0.01}/>
          <Slider label="γ (recovery)" v={gamma} set={setGamma} min={0.02} max={1.0} step={0.01}/>
          <Slider label="I₀" v={I0} set={setI0} min={0.001} max={0.2} step={0.001}/>
          <Slider label="h (step)" v={h} set={setH} min={0.001} max={0.05} step={0.001}/>
          <Slider label="steps" v={N} set={setN} min={200} max={4000} step={50}/>
          <ActiveReflection
            title="Active Reflection — SIR"
            storageKey="reflect_sir"
            prompts={[
              "Basic reproduction R₀ = β/γ: what threshold separates fadeout vs wave?",
              "Where is I(t) maximal (dI/dt=0 ⇒ S=γ/β)?",
              "How does reducing h change the curve smoothness vs compute?"
            ]}
          />
        </section>
      </div>
      <Phase path={path}/>
    </div>
  );
}

function Series({path}){
  const W=640,H=220,pad=12;
  const N=path.length;
  const maxY = 1;
  const X=i=> pad+(i/(N-1))*(W-2*pad);
  const Y=v=> H-pad - (v/maxY)*(H-2*pad);
  const poly = arr => arr.map((v,i)=>`${X(i)},${Y(v)}`).join(' ');
  return (
    <section className="p-3 rounded-lg bg-white/5 border border-white/10">
      <h3 className="font-semibold mb-2">Time Series (S, I, R)</h3>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
        <polyline points={poly(path.map(p=>p[0]))} fill="none" strokeWidth="2"/>
        <polyline points={poly(path.map(p=>p[1]))} fill="none" strokeWidth="2"/>
        <polyline points={poly(path.map(p=>p[2]))} fill="none" strokeWidth="2"/>
        <text x={pad} y={14} fontSize="10">S (top), I (middle hump), R (rises late)</text>
      </svg>
    </section>
  );
}
function Phase({path}){
  const W=640,H=240,pad=16;
  const xs=path.map(p=>p[0]), ys=path.map(p=>p[1]);
  const X=x=> pad + x*(W-2*pad);
  const Y=y=> H-pad - y*(H-2*pad);
  return (
    <section className="p-3 rounded-lg bg-white/5 border border-white/10">
      <h3 className="font-semibold mb-2">Phase Plane (S vs I)</h3>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
        {path.map((p,i)=>{
          const x1=i?X(path[i-1][0]):X(p[0]), y1=i?Y(path[i-1][1]):Y(p[1]);
          const x2=X(p[0]), y2=Y(p[1]);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth="1.4"/>;
        })}
      </svg>
    </section>
  );
}
function Slider({label,v,set,min,max,step}){
  const show = (typeof v==='number'&&v.toFixed) ? v.toFixed(3) : v;
  return (<div className="mb-2"><label className="text-sm opacity-80">{label}: <b>{show}</b></label>
    <input className="w-full" type="range" min={min} max={max} step={step} value={v}
      onChange={e=>set(parseFloat(e.target.value))}/></div>);
}
