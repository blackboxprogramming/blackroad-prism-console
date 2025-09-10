import { useMemo, useState } from "react";
import ActiveReflection from "./ActiveReflection.jsx";

function mapFun(z, kind){
  const [x,y]=z;
  if(kind==="z2"){ const xr=x*x - y*y, yr=2*x*y; return [xr,yr]; }
  if(kind==="exp"){ const ex=Math.exp(x); return [ex*Math.cos(y), ex*Math.sin(y)]; }
  if(kind==="inv"){ const d=x*x+y*y+1e-12; return [x/d, -y/d]; }
  return z;
}

export default function ConformalGridLab(){
  const [kind,setKind]=useState("z2");
  const [xmin,setXmin]=useState(-2), [xmax,setXmax]=useState(2);
  const [ymin,setYmin]=useState(-2), [ymax,setYmax]=useState(2);
  const [res,setRes]=useState(8);

  const grid = useMemo(()=>{
    const hLines=[], vLines=[];
    for(let j=0;j<=res;j++){
      const y = ymin + (ymax-ymin)*j/res;
      const seg=[];
      for(let i=0;i<=200;i++){
        const x = xmin + (xmax-xmin)*i/200;
        seg.push(mapFun([x,y], kind));
      }
      hLines.push(seg);
    }
    for(let i=0;i<=res;i++){
      const x = xmin + (xmax-xmin)*i/res;
      const seg=[];
      for(let j=0;j<=200;j++){
        const y = ymin + (ymax-ymin)*j/200;
        seg.push(mapFun([x,y], kind));
      }
      vLines.push(seg);
    }
    return {hLines,vLines};
  },[kind,xmin,xmax,ymin,ymax,res]);

  // autoscale to fit SVG
  const bounds = useMemo(()=>{
    const pts=[...grid.hLines.flat(), ...grid.vLines.flat()];
    const xs=pts.map(p=>p[0]), ys=pts.map(p=>p[1]);
    const minX=Math.min(...xs), maxX=Math.max(...xs);
    const minY=Math.min(...ys), maxY=Math.max(...ys);
    return {minX,maxX,minY,maxY};
  },[grid]);
  const W=640,H=360,pad=16;
  const X=(x)=> pad + (x-bounds.minX)/(bounds.maxX-bounds.minX+1e-9)*(W-2*pad);
  const Y=(y)=> H-pad - (y-bounds.minY)/(bounds.maxY-bounds.minY+1e-9)*(H-2*pad);

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">Conformal Map Grid — {kind}</h2>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
        <rect x="0" y="0" width={W} height={H} fill="none"/>
        {grid.hLines.map((seg,k)=><polyline key={`h${k}`} points={seg.map(p=>`${X(p[0])},${Y(p[1])}`).join(" ")} fill="none" strokeWidth="1"/>)}
        {grid.vLines.map((seg,k)=><polyline key={`v${k}`} points={seg.map(p=>`${X(p[0])},${Y(p[1])}`).join(" ")} fill="none" strokeWidth="1"/>)}
      </svg>
      <div className="grid" style={{gridTemplateColumns:"1fr 320px", gap:16}}>
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <Radio name="kind" value={kind} set={setKind} opts={[["z2","z²"],["exp","e^z"],["inv","1/z"]]}/>
          <Slider label="x min" v={xmin} set={setXmin} min={-4} max={-0.1} step={0.1}/>
          <Slider label="x max" v={xmax} set={setXmax} min={0.1} max={4} step={0.1}/>
          <Slider label="y min" v={ymin} set={setYmin} min={-4} max={-0.1} step={0.1}/>
          <Slider label="y max" v={ymax} set={setYmax} min={0.1} max={4} step={0.1}/>
          <Slider label="grid res" v={res} set={setRes} min={4} max={24} step={1}/>
        </section>
        <ActiveReflection
          title="Active Reflection — Conformal"
          storageKey="reflect_conformal"
          prompts={[
            "Which mapping preserves angles? (All 3 here, where defined.) How do circles/lines transform?",
            "For 1/z: what happens near the origin and at infinity?",
            "For e^z: how do stripes in Im(z) become rotations and scalings?"
          ]}
        />
      </div>
    </div>
  );
}
function Slider({label,v,set,min,max,step}){
  const show=(typeof v==='number'&&v.toFixed)?v.toFixed(2):v;
  return (<div className="mb-2"><label className="text-sm opacity-80">{label}: <b>{show}</b></label>
  <input className="w-full" type="range" min={min} max={max} step={step} value={v}
    onChange={e=>set(parseFloat(e.target.value))}/></div>);
}
function Radio({name,value,set,opts}){
  return (<div className="flex gap-3 text-sm">
    {opts.map(([val,lab])=><label key={val} className="flex items-center gap-1">
      <input type="radio" name={name} checked={value===val} onChange={()=>set(val)}/>{lab}
    </label>)}
  </div>);
}
