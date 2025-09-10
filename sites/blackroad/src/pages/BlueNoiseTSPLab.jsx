import { useEffect, useMemo, useRef, useState } from "react";
import ActiveReflection from "./ActiveReflection.jsx";

// --- Poisson disk (Bridson), then NN + 2-opt on resulting points ----
function rng(seed){ let s=seed|0||7; return ()=> (s=(1664525*s+1013904223)>>>0)/2**32; }
function bridson(width,height,r,k,seed){
  const rand=rng(seed);
  const cell=r/Math.SQRT2, gw=Math.ceil(width/cell), gh=Math.ceil(height/cell);
  const grid=new Int32Array(gw*gh).fill(-1), pts=[], active=[];
  const add=(p)=>{ pts.push(p); active.push(p); grid[((p.y/cell)|0)*gw + ((p.x/cell)|0)] = pts.length-1; };
  add({x: width*0.5, y: height*0.5});
  while(active.length){
    const idx=(rand()*active.length)|0; const p=active[idx]; let placed=false;
    for(let t=0;t<k;t++){
      const a=2*Math.PI*rand(), rr=r*(1+rand());
      const q={x:p.x + rr*Math.cos(a), y:p.y + rr*Math.sin(a)};
      if(q.x<0||q.y<0||q.x>=width||q.y>=height) continue;
      const gx=(q.x/cell)|0, gy=(q.y/cell)|0; let ok=true;
      for(let j=-2;j<=2;j++) for(let i=-2;i<=2;i++){
        const X=gx+i, Y=gy+j; if(X<0||Y<0||X>=gw||Y>=gh) continue;
        const id=grid[Y*gw+X]; if(id>=0){ const d=hyp(pts[id],q); if(d<r){ ok=false; break; } }
      }
      if(!ok) continue;
      add(q); placed=true; break;
    }
    if(!placed) active.splice(idx,1);
  }
  return pts;
}
const hyp=(a,b)=> Math.hypot(a.x-b.x, a.y-b.y);
function nnTour(P){
  if(P.length===0) return [];
  const n=P.length, used=new Array(n).fill(false), tour=[0]; used[0]=true;
  for(let m=1;m<n;m++){
    const last=tour[tour.length-1]; let best=-1, bd=1e18;
    for(let i=0;i<n;i++) if(!used[i]){ const d=hyp(P[last],P[i]); if(d<bd){bd=d; best=i;} }
    used[best]=true; tour.push(best);
  }
  return tour;
}
function twoOptOnce(P, T){
  const n=T.length; if(n<4) return T;
  const i=1 + ((Math.random()*(n-3))|0), j=i+1+((Math.random()*(n-i-2))|0);
  const a1=P[T[i-1]], a2=P[T[i]], b1=P[T[j]], b2=P[T[(j+1)%n]];
  const delta=(hyp(a1,a2)+hyp(b1,b2)) - (hyp(a1,b1)+hyp(a2,b2));
  if(delta>1e-9){ const t=T.slice(); for(let k=0;k<((j-i+1)>>1);k++){ [t[i+k],t[j-k]]=[t[j-k],t[i+k]]; } return t; }
  return T;
}
function length(P,T){ let L=0; for(let i=0;i<T.length;i++) L+=hyp(P[T[i]], P[T[(i+1)%T.length]]); return L; }

export default function BlueNoiseTSPLab(){
  const [W,H]=[640,360];
  const [r,setR]=useState(20);
  const [k,setK]=useState(30);
  const [seed,setSeed]=useState(7);
  const [itersPer,setIpf]=useState(400);
  const [running,setRun]=useState(true);

  const points = useMemo(()=> bridson(W,H,r,k,seed),[W,H,r,k,seed]);
  const tour0  = useMemo(()=> nnTour(points),[points]);
  const [tour,setTour]=useState(tour0);
  useEffect(()=> setTour(tour0),[tour0]);

  const L = useMemo(()=> length(points,tour),[points,tour]);

  const cnv=useRef(null);
  useEffect(()=>{
    const c=cnv.current; if(!c) return; c.width=W; c.height=H;
    const ctx=c.getContext("2d",{alpha:false});
    let raf;
    const loop=()=>{
      if(running){ for(let i=0;i<itersPer;i++) setTour(t=> twoOptOnce(points,t)); }
      draw(ctx,W,H,points,tour);
      raf=requestAnimationFrame(loop);
    };
    loop(); return ()=> cancelAnimationFrame(raf);
  },[points,tour,running,itersPer]);

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">Blue-Noise TSP — Poisson-disk → 2-opt</h2>
      <canvas ref={cnv} style={{width:"100%"}}/>
      <p className="text-sm">Points: <b>{points.length}</b> • Tour length ≈ <b>{L.toFixed(1)}</b></p>
      <div className="grid" style={{gridTemplateColumns:"1fr 360px", gap:16}}>
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <button className="px-2 py-1 rounded bg-white/10 border border-white/10" onClick={()=>setRun(r=>!r)}>{running?"Pause":"Run"}</button>
          <button className="ml-2 px-2 py-1 rounded bg-white/10 border border-white/10" onClick={()=>{ /* reseed */ }}>
            (Change sliders to reseed)
          </button>
        </section>
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <Slider label="Poisson radius r" v={r} set={setR} min={8} max={40} step={1}/>
          <Slider label="tries k" v={k} set={setK} min={5} max={60} step={1}/>
          <Slider label="2-opt iters/frame" v={itersPer} set={setIpf} min={20} max={3000} step={20}/>
          <Slider label="seed" v={seed} set={setSeed} min={1} max={9999} step={1}/>
          <ActiveReflection
            title="Active Reflection — Blue-Noise TSP"
            storageKey="reflect_blue_tsp"
            prompts={[
              "Larger r ⇒ fewer points ⇒ shorter tours (but less detail).",
              "2-opt rapidly removes crossings; late gains slow down.",
              "Blue-noise sampling yields evenly spaced cities — compare to random."
            ]}
          />
        </section>
      </div>
    </div>
  );
}
function draw(ctx,W,H,P,T){
  ctx.fillStyle="rgb(10,12,18)"; ctx.fillRect(0,0,W,H);
  // edges
  if(T.length){
    ctx.strokeStyle="#fff"; ctx.lineWidth=2; ctx.beginPath();
    for(let i=0;i<T.length;i++){ const a=P[T[i]], b=P[T[(i+1)%T.length]]; ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); }
    ctx.stroke();
  }
  // points
  ctx.fillStyle="#bbddff"; for(const p of P){ ctx.beginPath(); ctx.arc(p.x,p.y,2.3,0,Math.PI*2); ctx.fill(); }
}
function Slider({label,v,set,min,max,step}){ const show=(typeof v==='number'&&v.toFixed)?v.toFixed(2):v;
  return (<div className="mb-2"><label className="text-sm opacity-80">{label}: <b>{show}</b></label>
    <input className="w-full" type="range" min={min} max={max} step={step}
           value={v} onChange={e=>set(parseFloat(e.target.value))}/></div>);
}
