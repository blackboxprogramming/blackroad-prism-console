import { useEffect, useMemo, useRef, useState } from "react";
import ActiveReflection from "./ActiveReflection.jsx";

function dist(a,b){ const dx=a.x-b.x, dy=a.y-b.y; return Math.hypot(dx,dy); }
function segIntersectsRect(a,b, R){ // axis-aligned rectangle R={x,y,w,h}
  // Liang-Barsky clipping with explicit parameter range checks
  let t0=0, t1=1;
  const dx=b.x-a.x, dy=b.y-a.y;
  const p=[-dx, dx, -dy, dy];
  const q=[a.x-R.x, R.x+R.w-a.x, a.y-R.y, R.y+R.h-a.y];
  for(let i=0;i<4;i++){
    const pi=p[i], qi=q[i];
    if(pi===0){
      if(qi<0) return false; // parallel and outside
      continue;
    }
    const r=qi/pi;
    if(pi<0){
      if(r>t1) return false;
      if(r>t0) t0=r;
    } else {
      if(r<t0) return false;
      if(r<t1) t1=r;
    }
  }
  if(t0>t1) return false;
  const entersWithinSegment = (t0>=0 && t0<=1) || (t1>=0 && t1<=1);
  const segmentSpansRectangle = t0<0 && t1>1;
  return entersWithinSegment || segmentSpansRectangle;
}
function collision(a,b, obstacles){ for(const R of obstacles){ if(segIntersectsRect(a,b,R)) return true; } return false; }

export default function RRTStarLab(){
  const [W,H] = [640, 400];
  const [start,setStart]=useState({x:80,y:200});
  const [goal,setGoal]=useState({x:560,y:200});
  const [step,setStep]=useState(16);
  const [rad,setRad]=useState(42);
  const [goalBias,setBias]=useState(0.12);
  const [iters,setIters]=useState(1200);
  const [seed,setSeed]=useState(7);
  const [obs,setObs]=useState([
    {x:230,y:40,w:30,h:320},
    {x:350,y:120,w:40,h:160},
    {x:150,y:140,w:40,h:40},
    {x:450,y:40,w:30,h:320},
  ]);

  const rng=useMemo(()=>{ let s=seed|0||1; return ()=> (s=(1664525*s+1013904223)>>>0)/2**32; },[seed]);

  const cnv=useRef(null);
  useEffect(()=>{
    const c=cnv.current; if(!c) return; c.width=W; c.height=H;
    const ctx=c.getContext("2d",{alpha:false});
    // run RRT*
    const nodes=[{x:start.x,y:start.y,parent:-1,cost:0}];
    const nIters=iters;
    for(let k=0;k<nIters;k++){
      const sample = (rng()<goalBias)? goal : {x:rng()*W, y:rng()*H};
      // nearest
      let best=0, bd=1e9;
      for(let i=0;i<nodes.length;i++){ const d=dist(nodes[i],sample); if(d<bd){bd=d; best=i;} }
      const dirx=sample.x-nodes[best].x, diry=sample.y-nodes[best].y;
      const L=Math.hypot(dirx,diry)||1e-9;
      const newNode={ x: nodes[best].x + step*dirx/L, y: nodes[best].y + step*diry/L, parent: best, cost: nodes[best].cost+step };
      if(collision(nodes[best], newNode, obs)) continue;
      // choose parent within radius
      const near=[];
      for(let i=0;i<nodes.length;i++) if(dist(nodes[i],newNode)<=rad && !collision(nodes[i],newNode,obs)) near.push(i);
      let parent=best, pcost=nodes[best].cost+dist(nodes[best],newNode);
      for(const i of near){
        const cand=nodes[i].cost+dist(nodes[i],newNode);
        if(cand<pcost){ pcost=cand; parent=i; }
      }
      newNode.parent=parent; newNode.cost=pcost; const idx=nodes.push(newNode)-1;
      // rewire
      for(const i of near){
        const cand=pcost + dist(nodes[i],newNode);
        if(cand < nodes[i].cost && !collision(nodes[i],newNode,obs)){ nodes[i].parent=idx; nodes[i].cost=cand; }
      }
    }
    // pick goal connection
    let gi=-1, gbest=1e9;
    for(let i=0;i<nodes.length;i++){
      const d=dist(nodes[i],goal);
      if(d<rad && !collision(nodes[i],goal,obs)){
        const cost=nodes[i].cost+d;
        if(cost<gbest){ gbest=cost; gi=i; }
      }
    }
    // draw
    ctx.fillStyle="rgb(10,12,18)"; ctx.fillRect(0,0,W,H);
    // obstacles
    ctx.fillStyle="rgb(28,30,40)";
    obs.forEach(R=> ctx.fillRect(R.x,R.y,R.w,R.h));
    // edges
    ctx.strokeStyle="rgba(200,220,255,0.25)"; ctx.lineWidth=1;
    ctx.beginPath();
    for(let i=1;i<nodes.length;i++){
      const p=nodes[i], q=nodes[p.parent];
      ctx.moveTo(p.x,p.y); ctx.lineTo(q.x,q.y);
    }
    ctx.stroke();
    // best path
    if(gi>=0){
      ctx.strokeStyle="#fff"; ctx.lineWidth=2;
      ctx.beginPath();
      ctx.moveTo(goal.x,goal.y); ctx.lineTo(nodes[gi].x,nodes[gi].y);
      let i=gi; while(i>0){ const p=nodes[i], q=nodes[p.parent]; ctx.lineTo(q.x,q.y); i=p.parent; }
      ctx.stroke();
    }
    // start/goal
    ctx.fillStyle="#0ff"; ctx.beginPath(); ctx.arc(start.x,start.y,5,0,Math.PI*2); ctx.fill();
    ctx.fillStyle="#ff0"; ctx.beginPath(); ctx.arc(goal.x,goal.y,5,0,Math.PI*2); ctx.fill();
  },[W,H,start,goal,step,rad,goalBias,iters,obs,rng]);

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">RRT* — path planning</h2>
      <canvas ref={cnv} style={{width:"100%", imageRendering:"pixelated"}}/>
      <div className="grid" style={{gridTemplateColumns:"1fr 320px", gap:16}}>
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <Slider label="step" v={step} set={setStep} min={6} max={32} step={1}/>
          <Slider label="rewire radius" v={rad} set={setRad} min={20} max={80} step={1}/>
          <Slider label="goal bias" v={goalBias} set={setBias} min={0.0} max={0.5} step={0.01}/>
          <Slider label="iterations" v={iters} set={setIters} min={200} max={5000} step={100}/>
          <Slider label="seed" v={seed} set={setSeed} min={1} max={9999} step={1}/>
        </section>
        <ActiveReflection
          title="Active Reflection — RRT*"
          storageKey="reflect_rrtstar"
          prompts={[
            "Lower step: more precise trees but slower coverage.",
            "Raise radius: rewiring improves path optimality — where most?",
            "Increase goal bias: tree beelines more, but loses exploration."
          ]}
        />
      </div>
    </div>
  );
}
function Slider({label,v,set,min,max,step}){
  const show=(typeof v==='number'&&v.toFixed)?v.toFixed(2):v;
  return (<div className="mb-2"><label className="text-sm opacity-80">{label}: <b>{show}</b></label>
  <input className="w-full" type="range" min={min} max={max} step={step}
   value={v} onChange={e=>set(parseFloat(e.target.value))}/></div>);
}

