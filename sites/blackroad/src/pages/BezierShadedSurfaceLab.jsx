import { useEffect, useMemo, useRef, useState } from "react";
import ActiveReflection from "./ActiveReflection.jsx";

// Bicubic Bézier (4x4 control grid). Shade with lambertian from light dir.
function B(i,t){ return i===0?(1-t)**3 : i===1?3*t*(1-t)**2 : i===2?3*t*t*(1-t) : t**3; }
function dB(i,t){ // derivative
  return i===0? -3*(1-t)**2 : i===1? 3*(1-t)**2 - 6*t*(1-t) : i===2? 6*t*(1-t) - 3*t*t : 3*t*t;
}
function evalSurf(P,u,v){ // returns [x(u,v), y(u,v), z(u,v)] on param square mapped to [-1,1]^2
  let z=0; for(let i=0;i<4;i++) for(let j=0;j<4;j++) z += P[i][j]*B(i,u)*B(j,v);
  const x=-1+2*v, y=-1+2*u; return [x,y,z];
}
function evalDeriv(P,u,v){
  let zu=0, zv=0; for(let i=0;i<4;i++) for(let j=0;j<4;j++){ zu += P[i][j]*dB(i,u)*B(j,v); zv += P[i][j]*B(i,u)*dB(j,v); }
  // Param mapping: x=-1+2v, y=-1+2u → dx/dv=2, dy/du=2. Surface S=[x(v),y(u),z(u,v)]
  const Su=[0, 2, zu];  // ∂S/∂u (y changes, z_u)
  const Sv=[2, 0, zv];  // ∂S/∂v (x changes, z_v)
  // normal = Su × Sv
  const nx= Su[1]*Sv[2]-Su[2]*Sv[1];
  const ny= Su[2]*Sv[0]-Su[0]*Sv[2];
  const nz= Su[0]*Sv[1]-Su[1]*Sv[0];
  const nlen=Math.hypot(nx,ny,nz)||1e-9;
  return [nx/nlen, ny/nlen, nz/nlen];
}

export default function BezierShadedSurfaceLab(){
  const [P,setP]=useState(()=>{
    // gentle hill
    return [
      [0, 0.1, 0.1, 0],
      [0.1, 0.5, 0.5, 0.1],
      [0.1, 0.5, 0.5, 0.1],
      [0, 0.1, 0.1, 0],
    ];
  });
  const [light,setLight]=useState([0.6, 0.6, 0.5]); // normalized later
  const [grid,setGrid]=useState(28);

  const W=640,H=360;
  const cnv=useRef(null);
  const tris = useMemo(()=>{
    // tesselate into quads → 2 triangles per cell
    const L=[];
    for(let i=0;i<grid;i++){
      const u0=i/grid, u1=(i+1)/grid;
      for(let j=0;j<grid;j++){
        const v0=j/grid, v1=(j+1)/grid;
        const p00=evalSurf(P,u0,v0), n00=evalDeriv(P,u0,v0);
        const p10=evalSurf(P,u1,v0), n10=evalDeriv(P,u1,v0);
        const p11=evalSurf(P,u1,v1), n11=evalDeriv(P,u1,v1);
        const p01=evalSurf(P,u0,v1), n01=evalDeriv(P,u0,v1);
        L.push({p:[p00,p10,p11], n:[n00,n10,n11]});
        L.push({p:[p00,p11,p01], n:[n00,n11,n01]});
      }
    }
    return L;
  },[P,grid]);

  useEffect(()=>{
    const c=cnv.current; if(!c) return; c.width=W; c.height=H;
    const ctx=c.getContext("2d",{alpha:false});
    ctx.fillStyle="rgb(10,12,18)"; ctx.fillRect(0,0,W,H);
    const lightN=(()=>{ const L=light; const Lm=Math.hypot(...L)||1e-9; return [L[0]/Lm, L[1]/Lm, L[2]/Lm]; })();
    const proj=(x,y,z)=>{ const d=3.2, zc=z+d; const s=140/zc; return [W/2 + s*x, H/2 - s*y]; };
    // simple painter: draw back-to-front by avg z
    const sorted = tris.map(t=> ({...t, z:(t.p[0][2]+t.p[1][2]+t.p[2][2])/3})).sort((a,b)=> b.z-a.z);
    for(const t of sorted){
      const shade = t.n.map(n=> Math.max(0, n[0]*lightN[0]+n[1]*lightN[1]+n[2]*lightN[2]));
      const avg=(shade[0]+shade[1]+shade[2])/3;
      const col = `rgb(${Math.floor(40+215*avg)},${Math.floor(60+180*(1-avg))},${Math.floor(220*(1-avg))})`;
      ctx.fillStyle=col; ctx.beginPath();
      const q0=proj(...t.p[0]), q1=proj(...t.p[1]), q2=proj(...t.p[2]);
      ctx.moveTo(q0[0],q0[1]); ctx.lineTo(q1[0],q1[1]); ctx.lineTo(q2[0],q2[1]); ctx.closePath(); ctx.fill();
    }
  },[tris,light,W,H]);

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">Bézier Surface — Gouraud-ish Shading</h2>
      <canvas ref={cnv} style={{width:"100%"}}/>
      <div className="grid" style={{gridTemplateColumns:"1fr 360px", gap:16}}>
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <p className="text-sm">Drag sliders to move light; increase grid for smoother shading.</p>
        </section>
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <Slider label="grid tesselation" v={grid} set={setGrid} min={8} max={60} step={1}/>
          <Vec label="light (x,y,z)" v={light} set={setLight} min={-1.2} max={1.2} step={0.02}/>
          <ActiveReflection
            title="Active Reflection — Shaded Bézier"
            storageKey="reflect_bezier_shaded"
            prompts={[
              "Normals from ∂S/∂u×∂S/∂v set the brightness.",
              "Bias light upward vs lateral; which edges pop?",
              "Refining the grid smooths shading but costs draw calls."
            ]}
          />
        </section>
      </div>
    </div>
  );
}
function Slider({label,v,set,min,max,step}){ const show=(typeof v==="number"&&v.toFixed)?v.toFixed(2):v;
  return (<div className="mb-2"><label className="text-sm opacity-80">{label}: <b>{show}</b></label>
    <input className="w-full" type="range" min={min} max={max} step={step}
      value={v} onChange={e=>set(parseFloat(e.target.value))}/></div>);
}
function Vec({label,v,set,min,max,step}){
  const [x,y,z]=v;
  return (
    <div className="mb-2">
      <label className="text-sm opacity-80">{label}</label>
      <div className="grid" style={{gridTemplateColumns:"1fr 1fr 1fr", gap:8}}>
        <input type="range" min={min} max={max} step={step} value={x} onChange={e=>set([parseFloat(e.target.value),y,z])}/>
        <input type="range" min={min} max={max} step={step} value={y} onChange={e=>set([x,parseFloat(e.target.value),z])}/>
        <input type="range" min={min} max={max} step={step} value={z} onChange={e=>set([x,y,parseFloat(e.target.value)])}/>
      </div>
    </div>
  );
}
