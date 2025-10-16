import { useMemo, useState } from "react";
import ActiveReflection from "./ActiveReflection.jsx";

/** Visual intuition for quasi-conformal maps:
 *  We draw a circle grid in z-plane and map via a gentle QC warp with |μ|<k<1.
 *  Here we approximate a μ-dependent affine stretch field and integrate one step.
 */
function grid(n, xmin, xmax, ymin, ymax){
  const H=[], V=[];
  for(let j=0;j<=n;j++){
    const y=ymin+(ymax-ymin)*j/n;
    const row=[]; for(let i=0;i<=200;i++){ const x=xmin+(xmax-xmin)*i/200; row.push([x,y]); }
    H.push(row);
  }
  for(let i=0;i<=n;i++){
    const x=xmin+(xmax-xmin)*i/n;
    const col=[]; for(let j=0;j<=200;j++){ const y=ymin+(ymax-ymin)*j/200; col.push([x,y]); }
    V.push(col);
  }
  return {H,V};
}
function muField(x,y,k,theta){
  // |μ| = k (0..0.9), arg μ = 2θ sets ellipse axes
  const c=Math.cos(2*theta), s=Math.sin(2*theta);
  // taper by radius to keep gentle
  const r=Math.hypot(x,y);
  const kk = k*Math.exp(-r*r*0.6);
  return [kk*c, kk*s]; // (Re μ, Im μ)
}
function qcStep(x,y,k,theta){
  // local affine approximation: map differential with Beltrami μ
  const [muR,muI]=muField(x,y,k,theta);
  const muMag=Math.hypot(muR,muI);
  const a = (1+muMag)/(1-muMag); // dilatation K (for intuition)
  // rotate axes by theta and stretch
  const ct=Math.cos(theta), st=Math.sin(theta);
  const X = ct*x - st*y, Y = st*x + ct*y;
  const X2 = a*X, Y2 = Y/a;
  const xr =  ct*X2 + st*Y2;
  const yr = -st*X2 + ct*Y2;
  // blend with identity for gentle warp
  const t = Math.min(1, 0.6*muMag);
  return [(1-t)*x + t*xr, (1-t)*y + t*yr];
}
export default function QuasiConformalEggLab(){
  const [k,setK]=useState(0.5);     // |μ| max (0..0.9)
  const [theta,setTheta]=useState(Math.PI/6);
  const [xmin,setXmin]=useState(-1.6), [xmax,setXmax]=useState(1.6);
  const [ymin,setYmin]=useState(-1.2), [ymax,setYmax]=useState(1.2);
  const [res,setRes]=useState(12);

  const raw = useMemo(()=>grid(res,xmin,xmax,ymin,ymax),[res,xmin,xmax,ymin,ymax]);
  const warped = useMemo(()=>{
    const H=raw.H.map(seg=> seg.map(([x,y])=> qcStep(x,y,k,theta)));
    const V=raw.V.map(seg=> seg.map(([x,y])=> qcStep(x,y,k,theta)));
    return {H,V};
  },[raw,k,theta]);

  const W=640,H=360,pad=16;
  const bounds = useMemo(()=>{
    const pts=[...warped.H.flat(), ...warped.V.flat()];
    const xs=pts.map(p=>p[0]), ys=pts.map(p=>p[1]);
    return {minX:Math.min(...xs), maxX:Math.max(...xs), minY:Math.min(...ys), maxY:Math.max(...ys)};
  },[warped]);
  const X=x=> pad + (x-bounds.minX)/(bounds.maxX-bounds.minX+1e-9)*(W-2*pad);
  const Y=y=> H-pad - (y-bounds.minY)/(bounds.maxY-bounds.minY+1e-9)*(H-2*pad);

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">Quasi-Conformal “Egg” — gentle μ-warp</h2>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
        <rect x="0" y="0" width={W} height={H} fill="none"/>
        {warped.H.map((seg,i)=><polyline key={`h${i}`} points={seg.map(p=>`${X(p[0])},${Y(p[1])}`).join(' ')} fill="none" strokeWidth="1"/>)}
        {warped.V.map((seg,i)=><polyline key={`v${i}`} points={seg.map(p=>`${X(p[0])},${Y(p[1])}`).join(' ')} fill="none" strokeWidth="1"/>)}
      </svg>
      <div className="grid" style={{gridTemplateColumns:'1fr 320px', gap:16}}>
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <Slider label="|μ| (k)" v={k} set={setK} min={0.0} max={0.9} step={0.01}/>
          <Slider label="θ (axis)" v={theta} set={setTheta} min={-Math.PI} max={Math.PI} step={0.01}/>
          <Slider label="grid res" v={res} set={setRes} min={6} max={24} step={1}/>
        </section>
        <ActiveReflection
          title="Active Reflection — Quasi-Conformal"
          storageKey="reflect_qc"
          prompts={[
            "Raise |μ|: do circles become ellipses with bounded eccentricity K=(1+|μ|)/(1−|μ|)?",
            "Rotate θ: does the long axis of deformation rotate accordingly?",
            "How does tapering by radius keep the warp gentle near the edges?"
          ]}
        />
      </div>
    </div>
  );
}
function Slider({label,v,set,min,max,step}){
  const show=(typeof v==='number'&&v.toFixed)?v.toFixed(3):v;
  return (<div className="mb-2"><label className="text-sm opacity-80">{label}: <b>{show}</b></label>
    <input className="w-full" type="range" min={min} max={max} step={step}
      value={v} onChange={e=>set(parseFloat(e.target.value))}/></div>);
}
