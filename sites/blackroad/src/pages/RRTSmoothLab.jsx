import { useEffect, useMemo, useRef, useState } from "react";
import ActiveReflection from "./ActiveReflection.jsx";

const W=640, H=400;
const rngFrom = (seed) => { let s=seed|0||1; return ()=> (s=(1664525*s+1013904223)>>>0)/2**32; };
const dist = (a,b)=> Math.hypot(a.x-b.x, a.y-b.y);

function segRectHit(a,b,R){
  // Liang–Barsky clip (returns true if outside -> intersects)
  let t0=0,t1=1, dx=b.x-a.x, dy=b.y-a.y;
  const p=[-dx, dx, -dy, dy], q=[a.x-R.x, (R.x+R.w)-a.x, a.y-R.y, (R.y+R.h)-a.y];
  for(let i=0;i<4;i++){
    if(p[i]===0){ if(q[i]<0) return true; }
    else { const r=q[i]/p[i]; if(p[i]<0){ if(r>t1) return true; if(r>t0) t0=r; } else { if(r<t0) return true; if(r<t1) t1=r; } }
  }
  return false;
}
const collision = (a,b,obs)=> obs.some(R=>segRectHit(a,b,R));

function runRRTStar({start,goal,obs,step,rad,bias,iters,seed}){
  const R=rngFrom(seed);
  const nodes=[{x:start.x,y:start.y,parent:-1,cost:0}];
  for(let k=0;k<iters;k++){
    const s = (R()<bias)? goal : {x:R()*W, y:R()*H};
    // nearest
    let best=0, bd=1e9; for(let i=0;i<nodes.length;i++){ const d=dist(nodes[i],s); if(d<bd){bd=d; best=i;} }
    const v={ x: nodes[best].x + step*(s.x-nodes[best].x)/Math.max(1e-9,bd),
              y: nodes[best].y + step*(s.y-nodes[best].y)/Math.max(1e-9,bd),
              parent: best, cost: nodes[best].cost+step };
    if(collision(nodes[best], v, obs)) continue;
    const near=[]; for(let i=0;i<nodes.length;i++) if(dist(nodes[i],v)<=rad && !collision(nodes[i],v,obs)) near.push(i);
    let parent=best, pcost=nodes[best].cost+dist(nodes[best],v);
    for(const i of near){ const c=nodes[i].cost+dist(nodes[i],v); if(c<pcost){pcost=c; parent=i;} }
    v.parent=parent; v.cost=pcost; const idx=nodes.push(v)-1;
    for(const i of near){ const c=pcost+dist(nodes[i],v); if(c<nodes[i].cost && !collision(nodes[i],v,obs)){ nodes[i].parent=idx; nodes[i].cost=c; } }
  }
  // connect to goal
  let gi=-1, gbest=1e9; for(let i=0;i<nodes.length;i++){
    const d=dist(nodes[i],goal);
    if(d<rad && !collision(nodes[i],goal,obs)){
      const c=nodes[i].cost+d; if(c<gbest){ gbest=c; gi=i; }
    }
  }
  const raw=[]; if(gi>=0){ raw.push({x:goal.x,y:goal.y}); let i=gi; while(i>=0){ raw.push(nodes[i]); i=nodes[i].parent; } }
  return {nodes, raw: raw.reverse()};
}

function shortcut(path, obs, attempts=200){
  if(path.length<3) return path.slice();
  const P=path.slice();
  for(let a=0;a<attempts;a++){
    const i = Math.floor(Math.random()*(P.length-2));
    const j = i+2 + Math.floor(Math.random()*(P.length-i-2));
    if(j>=P.length) continue;
    if(!collision(P[i], P[j], obs)){ P.splice(i+1, j-i-1); }
  }
  return P;
}
function catmullRom(P, samples=6, alpha=0.5){
  if(P.length<3) return P.slice();
  const pts=[];
  for(let i=0;i<P.length-1;i++){
    const p0=P[Math.max(0,i-1)], p1=P[i], p2=P[i+1], p3=P[Math.min(P.length-1,i+2)];
    for(let s=0;s<samples;s++){
      const t=(s/samples);
      const tt=t*t, ttt=tt*t;
      // standard Catmull-Rom (uniform, alpha parameter kept simple)
      const a0 = -0.5*ttt +    tt - 0.5*t;
      const a1 =  1.5*ttt - 2.5*tt + 1.0;
      const a2 = -1.5*ttt + 2.0*tt + 0.5*t;
      const a3 =  0.5*ttt - 0.5*tt;
      pts.push({ x: a0*p0.x + a1*p1.x + a2*p2.x + a3*p3.x, y: a0*p0.y + a1*p1.y + a2*p2.y + a3*p3.y });
    }
  }
  pts.push(P[P.length-1]);
  return pts;
}

export default function RRTSmoothLab(){
  const [start,setStart]=useState({x:80,y:300});
  const [goal,setGoal]=useState({x:560,y:100});
  const [step,setStep]=useState(18);
  const [rad,setRad]=useState(48);
  const [bias,setBias]=useState(0.1);
  const [iters,setIters]=useState(1800);
  const [seed,setSeed]=useState(7);
  const [obs,setObs]=useState([
    {x:240,y:40,w:32,h:320},{x:360,y:100,w:40,h:200},{x:140,y:160,w:40,h:40},{x:460,y:60,w:28,h:300}
  ]);
  const [smoothK,setSmoothK]=useState(300);
  const [samples,setSamples]=useState(8);

  const result = useMemo(()=> runRRTStar({start,goal,obs,step,rad,bias,iters,seed}),[start,goal,obs,step,rad,bias,iters,seed]);
  const shortcutPath = useMemo(()=> shortcut(result.raw, obs, smoothK),[result, obs, smoothK]);
  const splinePath   = useMemo(()=> catmullRom(shortcutPath, samples),[shortcutPath, samples]);

  const cnv=useRef(null);
  useEffect(()=>{
    const c=cnv.current; if(!c) return; c.width=W; c.height=H;
    const ctx=c.getContext("2d",{alpha:false});
    // bg + obstacles
    ctx.fillStyle="rgb(10,12,18)"; ctx.fillRect(0,0,W,H);
    ctx.fillStyle="rgb(30,34,44)"; obs.forEach(R=>ctx.fillRect(R.x,R.y,R.w,R.h));
    // tree
    ctx.strokeStyle="rgba(200,220,255,0.25)"; ctx.lineWidth=1; ctx.beginPath();
    for(let i=1;i<result.nodes.length;i++){ const p=result.nodes[i], q=result.nodes[p.parent]; ctx.moveTo(p.x,p.y); ctx.lineTo(q.x,q.y); }
    ctx.stroke();
    // raw path
    if(result.raw.length>0){
      ctx.strokeStyle="rgba(255,255,255,0.5)"; ctx.lineWidth=2; ctx.beginPath();
      result.raw.forEach((p,i)=> i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y)); ctx.stroke();
    }
    // shortcut
    if(shortcutPath.length>0){
      ctx.strokeStyle="#9df"; ctx.lineWidth=2; ctx.beginPath();
      shortcutPath.forEach((p,i)=> i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y)); ctx.stroke();
    }
    // spline
    if(splinePath.length>0){
      ctx.strokeStyle="#fff"; ctx.lineWidth=3; ctx.beginPath();
      splinePath.forEach((p,i)=> i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y)); ctx.stroke();
    }
    // endpoints
    ctx.fillStyle="#0ff"; ctx.beginPath(); ctx.arc(start.x,start.y,5,0,Math.PI*2); ctx.fill();
    ctx.fillStyle="#ff0"; ctx.beginPath(); ctx.arc(goal.x,goal.y,5,0,Math.PI*2); ctx.fill();
  },[result,shortcutPath,splinePath,obs,start,goal]);

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">RRT* + Smoothing — shortcut & Catmull-Rom</h2>
      <canvas ref={cnv} style={{width:"100%", imageRendering:"pixelated"}}/>
      <div className="grid" style={{gridTemplateColumns:"1fr 320px", gap:16}}>
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <Slider label="step" v={step} set={setStep} min={8} max={32} step={1}/>
          <Slider label="rewire radius" v={rad} set={setRad} min={20} max={80} step={1}/>
          <Slider label="goal bias" v={bias} set={setBias} min={0} max={0.5} step={0.01}/>
          <Slider label="iterations" v={iters} set={setIters} min={300} max={6000} step={100}/>
          <Slider label="seed" v={seed} set={setSeed} min={1} max={9999} step={1}/>
          <Slider label="shortcut attempts" v={smoothK} set={setSmoothK} min={50} max={2000} step={50}/>
          <Slider label="spline samples/seg" v={samples} set={setSamples} min={3} max={16} step={1}/>
        </section>
        <ActiveReflection
          title="Active Reflection — RRT* Smoothing"
          storageKey="reflect_rrt_smooth"
          prompts={[
            "Shortcutting removes redundant wiggles — where most impactful?",
            "Catmull-Rom lengthens path a bit but looks natural — find a sweet spot.",
            "Change bias/radius: how does tree quality affect smoothing gain?"
          ]}
        />
      </div>
    </div>
  );
}
function Slider({label,v,set,min,max,step}){ const show=(typeof v==='number'&&v.toFixed)?v.toFixed(2):v;
  return (<div className="mb-2"><label className="text-sm opacity-80">{label}: <b>{show}</b></label>
  <input className="w-full" type="range" min={min} max={max} step={step} value={v} onChange={e=>set(parseFloat(e.target.value))}/></div>);
}

