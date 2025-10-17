import { useMemo, useState } from "react";
import ActiveReflection from "./ActiveReflection.jsx";

/** Toroidal domain: (θ,φ) ∈ [0,2π)^2 → embed in R^3 with major R, minor r.
 *  Beltrami-like field on torus chart (θ along tube, φ around hole):
 *    u_θ =  sin(kθ)*cos(mφ)
 *    u_φ =  cos(kθ)*sin(mφ)
 *  Streamlines traced in parameter space, then embedded.
 */
const TAU = Math.PI*2;
function embed(R,r,th,ph){
  const x = (R + r*Math.cos(th))*Math.cos(ph);
  const y = (R + r*Math.cos(th))*Math.sin(ph);
  const z =  r*Math.sin(th);
  return [x,y,z];
}
function field(k,m,th,ph){
  const u_th =  Math.sin(k*th)*Math.cos(m*ph);
  const u_ph =  Math.cos(k*th)*Math.sin(m*ph);
  return [u_th, u_ph];
}
function rk4Step(th,ph,h,k,m){
  const f = (a,b)=>field(k,m,a,b);
  const k1=f(th,ph);
  const k2=f(th+0.5*h*k1[0], ph+0.5*h*k1[1]);
  const k3=f(th+0.5*h*k2[0], ph+0.5*h*k2[1]);
  const k4=f(th+h*k3[0],     ph+h*k3[1]);
  const dth = (k1[0]+2*k2[0]+2*k3[0]+k4[0])/6;
  const dph = (k1[1]+2*k2[1]+2*k3[1]+k4[1])/6;
  return [ (th+h*dth) % TAU, (ph+h*dph) % TAU ];
}
export default function BeltramiTorusLab(){
  const [R,setR]=useState(2.0), [r,setr]=useState(0.7);
  const [k,setK]=useState(3), [m,setM]=useState(2);
  const [seeds,setSeeds]=useState(30);
  const [steps,setSteps]=useState(600);
  const [h,setH]=useState(0.02);

  const lines = useMemo(()=>{
    const out=[];
    for(let s=0;s<seeds;s++){
      let th = (TAU*Math.random()), ph = (TAU*s/seeds);
      const pts=[];
      for(let t=0;t<steps;t++){
        const [x,y,z] = embed(R,r,th,ph); pts.push([x,y,z]);
        [th,ph] = rk4Step(th,ph,h,k,m);
      }
      out.push(pts);
    }
    return out;
  },[R,r,k,m,seeds,steps,h]);

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">Beltrami Torus Flow — smooth streamlines</h2>
      <TorusPlot R={R} r={r} lines={lines}/>
      <div className="grid" style={{gridTemplateColumns:'1fr 320px', gap:16}}>
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <Slider label="R (major)" v={R} set={setR} min={1.2} max={3.0} step={0.01}/>
          <Slider label="r (minor)" v={r} set={setr} min={0.3} max={1.2} step={0.01}/>
          <Slider label="k" v={k} set={setK} min={1} max={8} step={1}/>
          <Slider label="m" v={m} set={setM} min={1} max={8} step={1}/>
          <Slider label="seeds" v={seeds} set={setSeeds} min={6} max={120} step={2}/>
          <Slider label="steps" v={steps} set={setSteps} min={100} max={2000} step={50}/>
          <Slider label="h (step)" v={h} set={setH} min={0.005} max={0.05} step={0.001}/>
        </section>
        <ActiveReflection
          title="Active Reflection — Beltrami Torus"
          storageKey="reflect_beltrami"
          prompts={[
            "Vary k,m: when do streamlines ‘lock’ into knotted patterns vs. quasi-ergodic wraps?",
            "Change R/r: how does curvature affect apparent twisting?",
            "Do streamlines ever intersect? (In steady 3D flows, integral curves are unique.)"
          ]}
        />
      </div>
    </div>
  );
}
function TorusPlot({R,r,lines}){
  const W=640,H=380,pad=14;
  // simple 3D→2D: yaw/pitch fixed for pleasing view
  const yaw=0.8, pitch=0.5;
  const rot = ([x,y,z])=>{
    const cy=Math.cos(yaw), sy=Math.sin(yaw);
    const cp=Math.cos(pitch), sp=Math.sin(pitch);
    const xr = cy*x + sy*z;
    const zr = -sy*x + cy*z;
    const yr = cp*y - sp*zr;
    const zr2 = sp*y + cp*zr;
    return [xr, yr, zr2];
  };
  // gather bounds
  const all=lines.flat();
  const proj = all.map(p=>rot(p));
  const xs=proj.map(p=>p[0]), ys=proj.map(p=>p[1]);
  const minX=Math.min(...xs, -R-r), maxX=Math.max(...xs, R+r);
  const minY=Math.min(...ys, -R-r), maxY=Math.max(...ys, R+r);
  const X=x=> pad + (x-minX)/(maxX-minX+1e-9)*(W-2*pad);
  const Y=y=> H-pad - (y-minY)/(maxY-minY+1e-9)*(H-2*pad);
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
      <rect x="0" y="0" width={W} height={H} fill="none"/>
      {lines.map((L,i)=>(
        <polyline key={i} points={L.map(p=>{const q=rot(p); return `${X(q[0])},${Y(q[1])}`;}).join(' ')}
          fill="none" strokeWidth="1"/>
      ))}
    </svg>
  );
}
function Slider({label,v,set,min,max,step}){
  const show=(typeof v==='number'&&v.toFixed)?v.toFixed(3):v;
  return (<div className="mb-2"><label className="text-sm opacity-80">{label}: <b>{show}</b></label>
    <input className="w-full" type="range" min={min} max={max} step={step}
      value={v} onChange={e=>set(parseFloat(e.target.value))}/></div>);
}
