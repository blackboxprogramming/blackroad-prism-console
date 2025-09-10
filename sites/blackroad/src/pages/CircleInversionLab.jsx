import { useEffect, useRef, useState } from "react";
import ActiveReflection from "./ActiveReflection.jsx";

function inv(p, c, R){
  const dx=p[0]-c[0], dy=p[1]-c[1];
  const d2=dx*dx+dy*dy || 1e-12;
  const k=(R*R)/d2;
  return [ c[0]+dx*k, c[1]+dy*k ];
}

export default function CircleInversionLab(){
  const [W,H]=[640,480];
  const [C1,setC1]=useState([ -0.6, 0.0 ]), [R1,setR1]=useState(0.7);
  const [C2,setC2]=useState([  0.6, 0.0 ]), [R2,setR2]=useState(0.7);
  const [C3,setC3]=useState([  0.0, 0.0 ]), [R3,setR3]=useState(0.45);
  const [depth,setDepth]=useState(9);
  const [seeds,setSeeds]=useState(500);

  const cnv=useRef(null);
  useEffect(()=>{
    const c=cnv.current; if(!c) return; c.width=W; c.height=H;
    const ctx=c.getContext("2d",{alpha:false});
    draw(ctx, W, H, {C1,R1,C2,R2,C3,R3,depth,seeds});
  },[C1,R1,C2,R2,C3,R3,depth,seeds]);

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">Circle Inversion Kaleidoscope — orbit toy</h2>
      <canvas ref={cnv} style={{width:"100%", imageRendering:"pixelated"}}/>
      <div className="grid" style={{gridTemplateColumns:'1fr 340px', gap:16}}>
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <Two label="C1 (x,y)" v={C1} set={setC1} min={-1.2} max={1.2} step={0.01}/>
          <Slider label="R1" v={R1} set={setR1} min={0.2} max={1.2} step={0.01}/>
          <Two label="C2 (x,y)" v={C2} set={setC2} min={-1.2} max={1.2} step={0.01}/>
          <Slider label="R2" v={R2} set={setR2} min={0.2} max={1.2} step={0.01}/>
          <Two label="C3 (x,y)" v={C3} set={setC3} min={-1.2} max={1.2} step={0.01}/>
          <Slider label="R3" v={R3} set={setR3} min={0.2} max={1.2} step={0.01}/>
          <Slider label="depth" v={depth} set={setDepth} min={3} max={16} step={1}/>
          <Slider label="#seeds" v={seeds} set={setSeeds} min={100} max={4000} step={50}/>
        </section>
        <ActiveReflection
          title="Active Reflection — Inversion"
          storageKey="reflect_inversion"
          prompts={[
            "Tweak radii/centers: when do symmetric rosettes emerge?",
            "Increase depth: how does complexity vs. density trade off?",
            "What geometric loci stay invariant under a chosen inversion?"
          ]}
        />
      </div>
    </div>
  );
}

function draw(ctx, W, H, S){
  const {C1,R1,C2,R2,C3,R3,depth,seeds}=S;
  ctx.clearRect(0,0,W,H);
  // to/from screen
  const X=x=> W/2 + x*(W*0.42);
  const Y=y=> H/2 - y*(W*0.42);
  // soft background
  ctx.fillStyle="rgb(10,12,18)"; ctx.fillRect(0,0,W,H);

  const circles=[{c:C1,R:R1},{c:C2,R:R2},{c:C3,R:R3}];

  // draw orbits
  ctx.beginPath();
  for(let s=0;s<seeds;s++){
    let p=[ (Math.random()*2-1)*0.9, (Math.random()*2-1)*0.9 ];
    for(let k=0;k<depth;k++){
      const j=(s+k)%3; // cycle inversions
      p = inv(p, circles[j].c, circles[j].R);
      if(Math.hypot(p[0],p[1])>5) break; // avoid blow-up
      if(k>2){ ctx.lineTo(X(p[0]),Y(p[1])); }
      else { ctx.moveTo(X(p[0]),Y(p[1])); }
    }
  }
  ctx.strokeStyle="#bbddff"; ctx.lineWidth=0.6; ctx.stroke();

  // draw circles (light)
  ctx.strokeStyle="rgba(255,255,255,0.25)"; ctx.lineWidth=1;
  for(const {c,R} of circles){
    ctx.beginPath();
    ctx.arc(X(c[0]),Y(c[1]), R*(W*0.42), 0, Math.PI*2);
    ctx.stroke();
  }
}

function Slider({label,v,set,min,max,step}){
  const show=(typeof v==='number'&&v.toFixed)?v.toFixed(3):v;
  return (<div className="mb-2"><label className="text-sm opacity-80">{label}: <b>{show}</b></label>
  <input className="w-full" type="range" min={min} max={max} step={step}
         value={v} onChange={e=>set(parseFloat(e.target.value))}/></div>);
}
function Two({label,v,set,min,max,step}){
  const [x,y]=v;
  return (
    <div className="mb-2">
      <label className="text-sm opacity-80 block">{label}</label>
      <div className="flex items-center gap-2">
        <input type="range" min={min} max={max} step={step} value={x}
          onChange={e=>set([parseFloat(e.target.value), y])} className="w-full"/>
        <input type="range" min={min} max={max} step={step} value={y}
          onChange={e=>set([x, parseFloat(e.target.value)])} className="w-full"/>
      </div>
    </div>
  );
}

