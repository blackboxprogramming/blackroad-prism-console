import { useMemo, useState } from "react";
import ActiveReflection from "./ActiveReflection.jsx";

function rng(seed){ let s=seed|0||2025; return ()=> (s=(1664525*s+1013904223)>>>0)/2**32; }

export default function PoissonDiskLab(){
  const [r,setR]=useState(0.04);
  const [k,setK]=useState(30);
  const [seed,setSeed]=useState(7);
  const [W,H]=[640,360];

  const pts = useMemo(()=>bridson(r,k,seed),[r,k,seed]);

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">Poisson-Disk Sampling — Bridson blue-noise</h2>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
        <rect x="0" y="0" width={W} height={H} fill="none"/>
        {pts.map(([x,y],i)=> <circle key={i} cx={x*W} cy={y*H} r="2.5"/>) }
      </svg>
      <div className="grid" style={{gridTemplateColumns:'1fr 320px', gap:16}}>
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <Slider label="radius r" v={r} set={setR} min={0.01} max={0.12} step={0.002}/>
          <Slider label="tries k" v={k} set={setK} min={5} max={60} step={1}/>
          <Slider label="seed" v={seed} set={setSeed} min={1} max={9999} step={1}/>
          <p className="text-sm mt-1">count ≈ <b>{pts.length}</b></p>
        </section>
        <ActiveReflection
          title="Active Reflection — Poisson Disk"
          storageKey="reflect_poisson_disk"
          prompts={[
            "Increase r: samples get sparser; what’s the growth of count vs 1/r²?",
            "Lower k: does quality degrade or produce clumps?",
            "Why does grid acceleration make it near O(n)?"
          ]}
        />
      </div>
    </div>
  );
}

function bridson(r,k,seed){
  const rand=rng(seed);
  const cell = r/Math.SQRT2;
  const gridSize = Math.ceil(1/cell);
  const grid = Array.from({length:gridSize*gridSize},()=>-1);
  const pts=[], active=[];

  function add(p){
    pts.push(p);
    active.push(p);
    const gx=Math.floor(p[0]/cell), gy=Math.floor(p[1]/cell);
    grid[gy*gridSize + gx]=pts.length-1;
  }
  add([rand(), rand()]);

  while(active.length){
    const idx = (active.length*rand())|0;
    const [x,y] = active[idx];
    let placed=false;
    for(let t=0;t<k;t++){
      const a=2*Math.PI*rand();
      const rr=r*(1+rand());
      const nx=x+rr*Math.cos(a), ny=y+rr*Math.sin(a);
      if(nx<0||ny<0||nx>=1||ny>=1) continue;
      if(valid([nx,ny])){ add([nx,ny]); placed=true; break; }
    }
    if(!placed){ active.splice(idx,1); }
  }

  function valid(p){
    const gx=Math.floor(p[0]/cell), gy=Math.floor(p[1]/cell);
    for(let j=-2;j<=2;j++) for(let i=-2;i<=2;i++){
      const X=gx+i, Y=gy+j;
      if(X<0||Y<0||X>=gridSize||Y>=gridSize) continue;
      const id = grid[Y*gridSize + X];
      if(id>=0){
        const q=pts[id]; const dx=q[0]-p[0], dy=q[1]-p[1];
        if(dx*dx+dy*dy < r*r) return false;
      }
    }
    return true;
  }
  return pts;
}
function Slider({label,v,set,min,max,step}){
  const show=typeof v==='number'&&v.toFixed ? v.toFixed(3):v;
  return (<div className="mb-2">
    <label className="text-sm opacity-80">{label}: <b>{show}</b></label>
    <input className="w-full" type="range" min={min} max={max} step={step} value={v}
      onChange={e=>set(parseFloat(e.target.value))}/>
  </div>);
}

