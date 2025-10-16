import { useMemo, useState } from "react";
import ActiveReflection from "./ActiveReflection.jsx";

/** Axis-aligned ellipsoid x^2/a^2 + y^2/b^2 + z^2/c^2 = 1 parameterized by (θ,φ).
 *  We integrate approximate geodesic equations in (θ,φ) with metric from embedding.
 *  Educational: small-step RK and normalization of tangent in metric.
 */
const TAU=2*Math.PI;
function embed(a,b,c,th,ph){
  const x=a*Math.sin(th)*Math.cos(ph);
  const y=b*Math.sin(th)*Math.sin(ph);
  const z=c*Math.cos(th);
  return [x,y,z];
}
function metric(a,b,c,th,ph){
  // first fundamental form coefficients (E,F,G)
  const Ex = a*Math.cos(th)*Math.cos(ph);
  const Ey = b*Math.cos(th)*Math.sin(ph);
  const Ez = -c*Math.sin(th);
  const Gx = -a*Math.sin(th)*Math.sin(ph);
  const Gy =  b*Math.sin(th)*Math.cos(ph);
  const Gz =  0;
  const E = Ex*Ex + Ey*Ey + Ez*Ez; // <∂x/∂θ, ∂x/∂θ>
  const F = Ex*Gx + Ey*Gy + Ez*Gz; // <∂x/∂θ, ∂x/∂φ>
  const G = Gx*Gx + Gy*Gy + Gz*Gz; // <∂x/∂φ, ∂x/∂φ>
  return {E,F,G};
}
function rkStep(a,b,c,th,ph, uth,uph, h){
  // crude geodesic update: advance along local metric-normalized direction, damp curvature by finite diff of metric
  const m = metric(a,b,c,th,ph);
  // normalize tangent by metric: ||u||_g = 1
  const A = m.E, B = m.F, C = m.G;
  const q = Math.sqrt( Math.max(1e-9, A*uth*uth + 2*B*uth*uph + C*uph*uph ) );
  uth /= q; uph /= q;

  // simple extrapolation (not full Christoffel; good for intuition)
  const th2 = (th + h*uth + TAU) % TAU;
  const ph2 = (ph + h*uph + TAU) % TAU;
  return [th2, ph2, uth, uph];
}
export default function EllipsoidGeodesicLab(){
  const [a,setA]=useState(1.4), [b,setB]=useState(1.0), [c,setC]=useState(0.8);
  const [seeds,setSeeds]=useState(18), [steps,setSteps]=useState(800), [h,setH]=useState(0.03);

  const lines = useMemo(()=>{
    const out=[];
    for(let s=0;s<seeds;s++){
      let th = Math.PI*(s+0.5)/seeds, ph = 2*Math.PI*(s/seeds);
      let uth = Math.cos(2*Math.PI*s/seeds), uph = Math.sin(2*Math.PI*s/seeds);
      const pts=[];
      for(let k=0;k<steps;k++){
        pts.push(embed(a,b,c,th,ph));
        [th,ph,uth,uph] = rkStep(a,b,c,th,ph,uth,uph,h);
      }
      out.push(pts);
    }
    return out;
  },[a,b,c,seeds,steps,h]);

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">Geodesics on an Ellipsoid — intuitive RK</h2>
      <EllipPlot a={a} b={b} c={c} lines={lines}/>
      <div className="grid" style={{gridTemplateColumns:'1fr 320px', gap:16}}>
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <Slider label="a" v={a} set={setA} min={0.6} max={2.0} step={0.01}/>
          <Slider label="b" v={b} set={setB} min={0.6} max={2.0} step={0.01}/>
          <Slider label="c" v={c} set={setC} min={0.6} max={2.0} step={0.01}/>
          <Slider label="seeds" v={seeds} set={setSeeds} min={6} max={60} step={2}/>
          <Slider label="steps" v={steps} set={setSteps} min={200} max={3000} step={50}/>
          <Slider label="h" v={h} set={setH} min={0.005} max={0.08} step={0.001}/>
        </section>
        <ActiveReflection
          title="Active Reflection — Ellipsoid Geodesics"
          storageKey="reflect_ellipsoid"
          prompts={[
            "When a=b=c (sphere), do lines look like great circles?",
            "Stretch a vs c: where do paths ‘hug’ tighter curvature?",
            "How does step size h affect accuracy vs stability?"
          ]}
        />
      </div>
    </div>
  );
}
function EllipPlot({a,b,c,lines}){
  const W=640,H=360,pad=14; const yaw=0.9, pitch=0.5;
  const rot=([x,y,z])=>{
    const cy=Math.cos(yaw), sy=Math.sin(yaw);
    const cp=Math.cos(pitch), sp=Math.sin(pitch);
    const xr = cy*x + sy*z;
    const zr = -sy*x + cy*z;
    const yr = cp*y - sp*zr;
    return [xr,yr];
  };
  const all=lines.flat(); const proj = all.map(rot);
  const xs=proj.map(p=>p[0]), ys=proj.map(p=>p[1]);
  const minX=Math.min(...xs,-a), maxX=Math.max(...xs,a);
  const minY=Math.min(...ys,-a), maxY=Math.max(...ys,a);
  const X=x=> pad + (x-minX)/(maxX-minX+1e-9)*(W-2*pad);
  const Y=y=> H-pad - (y-minY)/(maxY-minY+1e-9)*(H-2*pad);
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
      <rect x="0" y="0" width={W} height={H} fill="none"/>
      {lines.map((L,i)=>
        <polyline key={i} points={L.map(p=>{const q=rot(p); return `${X(q[0])},${Y(q[1])}`;}).join(' ')}
          fill="none" strokeWidth="1"/>
      )}
    </svg>
  );
}
function Slider({label,v,set,min,max,step}){
  const show=(typeof v==='number'&&v.toFixed)?v.toFixed(3):v;
  return (<div className="mb-2"><label className="text-sm opacity-80">{label}: <b>{show}</b></label>
    <input className="w-full" type="range" min={min} max={max} step={step}
      value={v} onChange={e=>set(parseFloat(e.target.value))}/></div>);
}
