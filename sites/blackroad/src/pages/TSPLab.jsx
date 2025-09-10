import { useEffect, useMemo, useRef, useState } from "react";
import ActiveReflection from "./ActiveReflection.jsx";

function rng(seed){ let s=seed|0||7; return ()=> (s=(1664525*s+1013904223)>>>0)/2**32; }
function dist(a,b){ const dx=a.x-b.x, dy=a.y-b.y; return Math.hypot(dx,dy); }

export default function TSPLab(){
  const [n,setN]=useState(60);
  const [seed,setSeed]=useState(7);
  const [running,setRunning]=useState(true);
  const [itersPer,setIpf]=useState(200);
  const [points,setPoints]=useState(()=> makePoints(n,seed));
  useEffect(()=> setPoints(makePoints(n,seed)),[n,seed]);

  const tour0 = useMemo(()=> nnTour(points),[points]);
  const [tour,setTour]=useState(tour0);
  useEffect(()=> setTour(tour0),[tour0]);

  const W=640,H=360;
  const cnv=useRef(null);
  useEffect(()=>{
    const c=cnv.current; if(!c) return; c.width=W; c.height=H;
    const ctx=c.getContext("2d",{alpha:false});
    let raf;
    const loop=()=>{
      if(running){ for(let i=0;i<itersPer;i++) setTour(t=> twoOptOnce(points, t)); }
      draw(ctx, W, H, points, tour);
      raf=requestAnimationFrame(loop);
    };
    loop(); return ()=> cancelAnimationFrame(raf);
  },[points,tour,running,itersPer]);

  const L = useMemo(()=> length(points,tour),[points,tour]);

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">Traveling Sales — NN + 2-opt</h2>
      <canvas ref={cnv} style={{width:"100%"}}/>
      <div className="grid" style={{gridTemplateColumns:"1fr 360px", gap:16}}>
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <button className="px-2 py-1 rounded bg-white/10 border border-white/10" onClick={()=>setRunning(r=>!r)}>{running?"Pause":"Run"}</button>
          <button className="ml-2 px-2 py-1 rounded bg-white/10 border border-white/10" onClick={()=>{ const P=makePoints(n,seed); setPoints(P); setTour(nnTour(P)); }}>Reseed</button>
        </section>
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <Slider label="points n" v={n} set={setN} min={10} max={300} step={10}/>
          <Slider label="seed" v={seed} set={setSeed} min={1} max={9999} step={1}/>
          <Slider label="2-opt iters/frame" v={itersPer} set={setIpf} min={10} max={2000} step={10}/>
          <p className="text-sm mt-2">Tour length ≈ <b>{L.toFixed(1)}</b></p>
          <ActiveReflection
            title="Active Reflection — TSP"
            storageKey="reflect_tsp"
            prompts={[
              "Nearest-neighbor gives quick but suboptimal tours.",
              "2-opt removes crossings first; later gains shrink.",
              "Dense clusters: NN can trap you — notice where 2-opt rescues."
            ]}
          />
        </section>
      </div>
    </div>
  );
}

function makePoints(n,seed){
  const R=rng(seed); return Array.from({length:n},()=>({x: 30+R()*580, y: 20+R()*320}));
}
function nnTour(P){
  const n=P.length, used=Array(n).fill(false), tour=[0]; used[0]=true;
  for(let k=1;k<n;k++){
    const last=tour[tour.length-1]; let best=-1, bd=1e18;
    for(let i=0;i<n;i++) if(!used[i]){ const d=dist(P[last],P[i]); if(d<bd){bd=d; best=i;} }
    used[best]=true; tour.push(best);
  }
  return tour;
}
function length(P, tour){
  let L=0; for(let i=0;i<tour.length;i++){ const a=P[tour[i]], b=P[tour[(i+1)%tour.length]]; L+=dist(a,b); } return L;
}
function twoOptOnce(P, tour){
  const n=tour.length; if(n<4) return tour;
  const i = 1 + ((Math.random()*(n-3))|0); const j = i + 1 + ((Math.random()*(n-i-2))|0);
  const a1=P[tour[i-1]], a2=P[tour[i]], b1=P[tour[j]], b2=P[tour[(j+1)%n]];
  const delta = (dist(a1,a2)+dist(b1,b2)) - (dist(a1,b1)+dist(a2,b2));
  if(delta>1e-9){ // improve by reversing [i..j]
    const t=tour.slice(); for(let k=0;k<((j-i+1)>>1);k++){ [t[i+k], t[j-k]] = [t[j-k], t[i+k]]; } return t;
  }
  return tour;
}
function draw(ctx,W,H,P,t){
  ctx.fillStyle="rgb(10,12,18)"; ctx.fillRect(0,0,W,H);
  // edges
  ctx.strokeStyle="#fff"; ctx.lineWidth=2; ctx.beginPath();
  for(let i=0;i<t.length;i++){ const a=P[t[i]], b=P[t[(i+1)%t.length]]; ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); }
  ctx.stroke();
  // points
  ctx.fillStyle="#bbddff"; for(const p of P){ ctx.beginPath(); ctx.arc(p.x,p.y,3,0,Math.PI*2); ctx.fill(); }
}
function Slider({label,v,set,min,max,step}){ const show=(typeof v==='number'&&v.toFixed)?v.toFixed(0):v;
  return (<div className="mb-2"><label className="text-sm opacity-80">{label}: <b>{show}</b></label>
    <input className="w-full" type="range" min={min} max={max} step={step}
           value={v} onChange={e=>set(parseFloat(e.target.value))}/></div>);
}

