import { useMemo, useRef, useEffect, useState } from "react";
import ActiveReflection from "./ActiveReflection.jsx";

/** Build a 3-D scalar field F(x,y,z) (sum of Gaussians + sphere),
 *  then view iso-contours on a z-slice via marching squares. */
function F(x,y,z){ // x,y,z in [-1,1]
  const g=(cx,cy,cz,s)=>(Math.exp(-((x-cx)**2+(y-cy)**2+(z-cz)**2)/(2*s*s)));
  const sphere = (x*x + y*y + z*z) - 0.45*0.45;
  return g(-.3,0,.1,0.25)+ g(.35,.1,-.2,0.22) + 0.6*Math.exp(-sphere*6);
}
function marching2d(f, N, iso){
  const L=1, h=2*L/N, lines=[];
  for(let i=0;i<N;i++) for(let j=0;j<N;j++){
    const x=-L + j*h, y=-L + i*h;
    const s = [
      f(x,y) - iso, f(x+h,y) - iso, f(x+h,y+h) - iso, f(x,y+h) - iso
    ].map(v=> v>0?1:0);
    const code = s[0] | (s[1]<<1) | (s[2]<<2) | (s[3]<<3);
    if(code===0||code===15) continue;
    const edge=(a,b)=>{ const P=[[x,y],[x+h,y],[x+h,y+h],[x,y+h]];
      const fa=f(P[a][0],P[a][1]), fb=f(P[b][0],P[b][1]);
      const t=(iso-fa)/((fb-fa)||1e-9);
      return [P[a][0]+t*(P[b][0]-P[a][0]), P[a][1]+t*(P[b][1]-P[a][1])];
    };
    const table={1:[[3,0]],2:[[0,1]],3:[[3,1]],4:[[1,2]],5:[[3,0],[1,2]],6:[[0,2]],7:[[3,2]],
                 8:[[2,3]],9:[[0,2]],10:[[1,3],[0,2]],11:[[1,3]],12:[[1,3]],13:[[0,1]],14:[[3,0]]};
    const segs=table[code]||[];
    for(const [ea,eb] of segs){ const A=edge(ea,(ea+1)%4), B=edge(eb,(eb+1)%4); lines.push([A,B]); }
  }
  return lines;
}

export default function IsoSliceLab(){
  const [N,setN]=useState(64);      // slice resolution
  const [iso,setIso]=useState(0.9); // iso-value
  const [z,setZ]=useState(0.0);     // slice z in [-1,1]
  const lines = useMemo(()=>{
    const f2 = (x,y)=> F(x,y,z); return marching2d(f2,N,iso);
  },[N,iso,z]);

  const W=640,H=360,pad=20, L=1;
  const X=x=> pad + (x+L)/(2*L)*(W-2*pad);
  const Y=y=> H-pad - (y+L)/(2*L)*(H-2*pad);

  const cnv=useRef(null);
  useEffect(()=>{
    const c=cnv.current; if(!c) return;
    const ctx=c.getContext("2d",{alpha:false});
    ctx.clearRect(0,0,W,H);
    // Base grid
    ctx.strokeStyle="rgba(255,255,255,0.2)"; ctx.lineWidth=1;
    for(let i=0;i<=6;i++){
      const t=-L+i*(2*L/6);
      ctx.beginPath(); ctx.moveTo(X(t),Y(-L)); ctx.lineTo(X(t),Y(L)); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(X(-L),Y(t)); ctx.lineTo(X(L),Y(t)); ctx.stroke();
    }
    // Contours
    ctx.strokeStyle="#fff"; ctx.lineWidth=2;
    for(const seg of lines){
      ctx.beginPath();
      ctx.moveTo(X(seg[0][0]),Y(seg[0][1]));
      ctx.lineTo(X(seg[1][0]),Y(seg[1][1]));
      ctx.stroke();
    }
  },[lines]);

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">3-D Iso-Surface Slicer — z-slice contours</h2>
      <canvas ref={cnv} width={W} height={H} style={{width:"100%"}}/>
      <div className="grid" style={{gridTemplateColumns:"1fr 320px", gap:16}}>
        <div/>
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <Slider label="resolution N" v={N} set={setN} min={32} max={128} step={8}/>
          <Slider label="iso value" v={iso} set={setIso} min={0.2} max={1.6} step={0.02}/>
          <Slider label="slice z" v={z} set={setZ} min={-1} max={1} step={0.02}/>
          <ActiveReflection
            title="Active Reflection — Iso Slices"
            storageKey="reflect_iso"
            prompts={[
              "Sweep z: where do contours appear/disappear (topology changes)?",
              "Change iso: smaller vs larger level sets give different shapes.",
              "Imagine stacking contours → a full isosurface (marching cubes)."
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
