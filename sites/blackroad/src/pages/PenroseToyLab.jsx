import { useMemo, useState } from "react";
import ActiveReflection from "./ActiveReflection.jsx";

const TAU = Math.PI*2;
function rot([x,y], a){ const c=Math.cos(a), s=Math.sin(a); return [c*x - s*y, s*x + c*y]; }
function add(a,b){ return [a[0]+b[0], a[1]+b[1]]; }
function scale([x,y], s){ return [x*s,y*s]; }

// simple prototiles (kite & dart-ish) with unit edges in local coords
function kite(){ // four points
  const g = (1+Math.sqrt(5))/2;
  return [[0,0],[1,0],[1-1/g, Math.sin(Math.acos((1-1/g)) ) ], [0,0]]; // close path (rough)
}
function dart(){
  const g=(1+Math.sqrt(5))/2;
  return [[0,0],[1,0],[1-1/g, -Math.sin(Math.acos((1-1/g))) ], [0,0]];
}
function place(poly, pos, ang, s){ return poly.map(p=> add(pos, rot(scale(p,s), ang))); }

function inflate(tiles){
  // toy inflation: split each tile into two scaled ones with golden ratio
  const g=(1+Math.sqrt(5))/2, s=1/g;
  const out=[];
  for(const t of tiles){
    const {kind,pos,ang,size} = t;
    if(kind==='kite'){
      out.push({kind:'kite', pos:pos, ang:ang, size:size*s});
      out.push({kind:'dart', pos:add(pos, rot([size,0],ang)), ang:ang+Math.PI*(3- g)/5, size:size*s});
    }else{
      out.push({kind:'dart', pos:pos, ang:ang, size:size*s});
      out.push({kind:'kite', pos:add(pos, rot([size,0],ang)), ang:ang-Math.PI*(3- g)/5, size:size*s});
    }
  }
  return out;
}

export default function PenroseToyLab(){
  const [depth,setDepth]=useState(4);
  const [scale0,setScale0]=useState(110);
  const [seed,setSeed]=useState(0); // unused but kept for future jitter controls

  const tiles = useMemo(()=>{
    // start from decagon star of kites
    const base=[];
    for(let i=0;i<10;i++){
      base.push({kind:'kite', pos:[0,0], ang:i*(TAU/10), size:1});
    }
    let T = base;
    for(let d=0; d<depth; d++){ T = inflate(T); }
    return T;
  },[depth,seed]);

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">Penrose-ish Tiling — Inflation Toy</h2>
      <Tiling tiles={tiles} scale0={scale0}/>
      <div className="grid" style={{gridTemplateColumns:'1fr 320px', gap:16}}>
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <Slider label="inflation depth" v={depth} set={setDepth} min={0} max={7} step={1}/>
          <Slider label="scale" v={scale0} set={setScale0} min={60} max={200} step={2}/>
        </section>
        <ActiveReflection
          title="Active Reflection — Penrose toy"
          storageKey="reflect_penrose"
          prompts={[
            "Increase depth: do local patterns repeat without global periodicity?",
            "Rotate imagination: can you spot star/flower clusters emerging?",
            "How does golden ratio scaling keep proportions harmonious?"
          ]}
        />
      </div>
    </div>
  );
}

function Tiling({tiles, scale0}){
  const W=640,H=480, pad=16;
  // center & auto scale
  const polys = tiles.map(t=>{
    const pts = (t.kind==='kite'? kite(): dart());
    return place(pts, t.pos, t.ang, t.size);
  });
  // bounds
  let xs=[], ys=[];
  for(const poly of polys){ for(const [x,y] of poly){ xs.push(x); ys.push(y); } }
  const minX=Math.min(...xs, -1), maxX=Math.max(...xs, 1);
  const minY=Math.min(...ys, -1), maxY=Math.max(...ys, 1);
  const S = scale0/Math.max(maxX-minX, maxY-minY);
  const X=x=> W/2 + S*(x - (minX+maxX)/2);
  const Y=y=> H/2 - S*(y - (minY+maxY)/2);

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
      <rect x="0" y="0" width={W} height={H} fill="none"/>
      {polys.map((poly,i)=>{
        const pts = poly.map(([x,y])=> `${X(x)},${Y(y)}`).join(' ');
        return <polyline key={i} points={pts} fill="none" stroke="currentColor" strokeWidth="1.5"/>;
      })}
    </svg>
  );
}
function Slider({label,v,set,min,max,step}){
  const show=(typeof v==='number'&&v.toFixed)?v.toFixed(3):v;
  return (<div className="mb-2"><label className="text-sm opacity-80">{label}: <b>{show}</b></label>
    <input className="w-full" type="range" min={min} max={max} step={step}
      value={v} onChange={e=>set(parseFloat(e.target.value))}/></div>);
}
