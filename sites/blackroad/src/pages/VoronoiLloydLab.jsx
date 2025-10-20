import { useEffect, useMemo, useRef, useState } from "react";
import ActiveReflection from "./ActiveReflection.jsx";

function rng(seed){ let s=seed|0||99; return ()=> (s=(1103515245*s+12345)>>>0)/2**32; }

export default function VoronoiLloydLab(){
  const [W,H] = [640, 360];
  const [sites,setSites]=useState(24);
  const [seed,setSeed]=useState(7);
  const [grid,setGrid]=useState(2); // subsampling per pixel for smoother centroid
  const [iters,setIters]=useState(0);

  const {pts} = useMemo(()=>({pts:initSites(sites, W, H, seed)}),[sites,W,H,seed]);

  const cnv=useRef(null);
  useEffect(()=>{
    const c=cnv.current; if(!c) return; c.width=W; c.height=H;
    let P=pts.map(p=>({...p})); // copy
    for(let t=0;t<iters;t++) P = lloydStep(P, W, H, grid);
    drawVoronoi(c.getContext("2d", {alpha:false}), P, W, H);
  },[pts, W, H, grid, iters]);

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">Voronoi + Lloyd Relaxation</h2>
      <canvas ref={cnv} style={{width:"100%"}}/>
      <div className="grid" style={{gridTemplateColumns:"1fr 320px", gap:16}}>
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <Slider label="sites" v={sites} set={setSites} min={6} max={200} step={2}/>
          <Slider label="seed" v={seed} set={setSeed} min={1} max={9999} step={1}/>
          <Slider label="grid subsample" v={grid} set={setGrid} min={1} max={6} step={1}/>
          <Slider label="Lloyd iterations" v={iters} set={setIters} min={0} max={20} step={1}/>
        </section>
        <ActiveReflection
          title="Active Reflection — Voronoi/Lloyd"
          storageKey="reflect_lloyd"
          prompts={[
            "As iterations grow, do cells become more uniform (centroidal)?",
            "What happens to long skinny cells after a few steps?",
            "How does subsampling affect centroid accuracy vs compute?"
          ]}
        />
      </div>
    </div>
  );
}

function initSites(n,W,H,seed){
  const r=rng(seed); const pts=[];
  for(let i=0;i<n;i++) pts.push({x: r()*W, y: r()*H});
  return pts;
}

function lloydStep(P, W, H, sub){
  // approximate centroids on a coarse grid
  const cells = P.map(()=>({sx:0, sy:0, c:0}));
  for(let y=0;y<H;y+=sub) for(let x=0;x<W;x+=sub){
    let best=0, bd=1e18;
    for(let i=0;i<P.length;i++){
      const dx=x-P[i].x, dy=y-P[i].y; const d=dx*dx+dy*dy;
      if(d<bd){ bd=d; best=i; }
    }
    cells[best].sx+=x; cells[best].sy+=y; cells[best].c+=1;
  }
  const Q = P.map((p,i)=>{
    const c=cells[i].c||1;
    return { x: (cells[i].sx/c), y: (cells[i].sy/c) };
  });
  return Q;
}

function drawVoronoi(ctx, P, W, H){
  const img = ctx.createImageData(W,H);
  // precolor sites softly
  const cols = P.map((_,i)=>{
    const a = (i*1.618)%1; // golden hue
    const r=Math.floor(80+160*a), g=Math.floor(120+100*(1-a)), b=Math.floor(200-80*a);
    return [r,g,b];
  });
  for(let y=0;y<H;y++){
    for(let x=0;x<W;x++){
      let best=0, bd=1e18;
      for(let i=0;i<P.length;i++){
        const dx=x-P[i].x, dy=y-P[i].y; const d=dx*dx+dy*dy;
        if(d<bd){ bd=d; best=i; }
      }
      const off=4*(y*W+x); const c=cols[best];
      img.data[off]=c[0]; img.data[off+1]=c[1]; img.data[off+2]=c[2]; img.data[off+3]=255;
    }
  }
  ctx.putImageData(img,0,0);
  // draw sites
  ctx.beginPath();
  for(const p of P){ ctx.moveTo(p.x+2,p.y); ctx.arc(p.x,p.y,2,0,Math.PI*2); }
  ctx.stroke();
}

function Slider({label,v,set,min,max,step}){
  const show=(typeof v==="number"&&v.toFixed)?v.toFixed(3):v;
  return (<div className="mb-2"><label className="text-sm opacity-80">{label}: <b>{show}</b></label>
    <input className="w-full" type="range" min={min} max={max} step={step}
      value={v} onChange={e=>set(parseFloat(e.target.value))}/></div>);
}
