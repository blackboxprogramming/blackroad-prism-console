import { useMemo, useRef, useState, useEffect, forwardRef } from "react";
import ActiveReflection from "./ActiveReflection.jsx";

// Max-Cut ≈ maximize (1/2) Σ w_ij (1 - s_i s_j) with s_i∈{-1,1}
// Smooth relaxation: s_i ∈ [-1,1], gradient ascent with projection.

function rng(seed){ let s=seed|0||1; return ()=> (s=(1664525*s+1013904223)>>>0)/2**32; }

export default function IsingMaxCutLab(){
  const [n,setN]=useState(8);
  const [seed,setSeed]=useState(7);
  const [iters,setIters]=useState(500);
  const [lr,setLR]=useState(0.05);
  const [density,setDen]=useState(0.4);

  const {nodes, W} = useMemo(()=>makeGraph(n, density, seed),[n,density,seed]);
  const res = useMemo(()=> relaxMaxCut(W, iters, lr, seed),[W,iters,lr,seed]);

  const svgRef=useRef(null);
  useEffect(()=>{ // allow drag of layout only (doesn't change cut)
    const svg=svgRef.current; if(!svg) return;
    let drag=-1, down=false, P=[...nodes];
    const hit=(x,y)=> P.findIndex(p=> (p.x-x)**2+(p.y-y)**2<12**2);
    const to= e=>{
      const r=svg.getBoundingClientRect(); return {x:e.clientX-r.left, y:e.clientY-r.top};
    };
    const md=e=>{ const p=to(e); const id=hit(p.x,p.y); if(id>=0){drag=id; down=true;} };
    const mv=e=>{ if(!down||drag<0) return; const p=to(e); P[drag]={...P[drag], x:p.x, y:p.y}; };
    const up=()=>{ down=false; drag=-1; };
    svg.addEventListener("mousedown",md); window.addEventListener("mousemove",mv); window.addEventListener("mouseup",up);
    return ()=>{ svg.removeEventListener("mousedown",md); window.removeEventListener("mousemove",mv); window.removeEventListener("mouseup",up); };
  },[nodes]);

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">Max-Cut — Ising Relaxation (toy)</h2>
      <Graph ref={svgRef} nodes={nodes} W={W} spins={res.spins}/>
      <div className="grid" style={{gridTemplateColumns:"1fr 340px", gap:16}}>
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <Slider label="n nodes" v={n} set={setN} min={4} max={16} step={1}/>
          <Slider label="edge density" v={density} set={setDen} min={0.1} max={0.9} step={0.05}/>
          <Slider label="iterations" v={iters} set={setIters} min={100} max={2000} step={50}/>
          <Slider label="learning rate" v={lr} set={setLR} min={0.005} max={0.2} step={0.005}/>
          <Slider label="seed" v={seed} set={setSeed} min={1} max={9999} step={1}/>
          <p className="text-sm mt-2">Cut size ≈ <b>{res.cut.toFixed(2)}</b></p>
        </section>
        <ActiveReflection
          title="Active Reflection — Max-Cut"
          storageKey="reflect_maxcut"
          prompts={[
            "Compare random seeds: do you get similar cut values?",
            "Lower LR: convergence steadier but slower; watch oscillations.",
            "Why does projecting spins to ±1 at the end improve the discrete cut?"
          ]}
        />
      </div>
    </div>
  );
}

function makeGraph(n, den, seed){
  const r=rng(seed);
  const nodes=[]; const W=Array.from({length:n},()=>Array(n).fill(0));
  // circle layout
  const R=130, cx=320, cy=180;
  for(let i=0;i<n;i++){
    const t=2*Math.PI*i/n;
    nodes.push({x: cx + R*Math.cos(t), y: cy + R*Math.sin(t)});
  }
  for(let i=0;i<n;i++) for(let j=i+1;j<n;j++){
    if(r()<den){ const w=0.5 + r(); W[i][j]=W[j][i]=w; }
  }
  return {nodes, W};
}
function relaxMaxCut(W, iters, lr, seed){
  const n=W.length; const r=rng(seed);
  let s = Array(n).fill(0).map(()=> r()*2-1); // spins in [-1,1]
  const energy=()=> 0.5*sum2(W,(i,j)=> W[i][j]*(1 - Math.sign(s[i])*Math.sign(s[j])) );
  for(let t=0;t<iters;t++){
    // grad of E ≈ −Σ_j W_ij s_j  (from −sᵀ W s surrogate)
    const g = Array(n).fill(0);
    for(let i=0;i<n;i++){ let acc=0; for(let j=0;j<n;j++) acc += W[i][j]*s[j]; g[i]= -2*acc; }
    for(let i=0;i<n;i++){ s[i]+= lr*g[i]; s[i]=Math.max(-1, Math.min(1, s[i])); }
  }
  const spins = s.map(v=> v>=0? 1 : -1);
  const cut = 0.5*sum2(W,(i,j)=> (spins[i]!==spins[j]? W[i][j] : 0));
  return {spins, cut};
}
function sum2(W, f){ const n=W.length; let S=0; for(let i=0;i<n;i++) for(let j=i+1;j<n;j++) S+=f(i,j); return S; }

const Graph = forwardRef(function Graph({nodes, W, spins}, ref){
  const Wsvg=640,H=360;
  return (
    <section className="p-3 rounded-lg bg-white/5 border border-white/10">
      <svg ref={ref} width="100%" viewBox={`0 0 ${Wsvg} ${H}`}>
        <rect x="0" y="0" width={Wsvg} height={H} fill="none"/>
        {/* edges */}
        {nodes.map((a,i)=> nodes.map((b,j)=> (j>i && W[i][j]>0) ? (
          <line key={`${i}-${j}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} strokeWidth={0.5+W[i][j]} opacity="0.35"/>
        ) : null))}
        {/* nodes colored by spin */}
        {nodes.map((p,i)=>(
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="12"/>
            <text x={p.x-4} y={p.y+4} fontSize="12">{spins[i]>0?"A":"B"}</text>
          </g>
        ))}
      </svg>
    </section>
  );
});
function Slider({label,v,set,min,max,step}){
  const show=(typeof v==='number'&&v.toFixed)?v.toFixed(3):v;
  return (<div className="mb-2"><label className="text-sm opacity-80">{label}: <b>{show}</b></label>
  <input className="w-full" type="range" min={min} max={max} step={step}
    value={v} onChange={e=>set(parseFloat(e.target.value))}/></div>);
}

