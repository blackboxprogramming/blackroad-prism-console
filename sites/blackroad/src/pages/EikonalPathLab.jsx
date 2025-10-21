import { useEffect, useMemo, useRef, useState } from "react";
import ActiveReflection from "./ActiveReflection.jsx";

export default function EikonalPathLab(){
  const [N,setN]=useState(128);
  const [iters,setIters]=useState(60);
  const [brush,setBrush]=useState(3);
  const [mode,setMode]=useState("walls"); // paint walls or erase
  const [goal,setGoal]=useState([64,64]);
  const [start,setStart]=useState([16,16]);
  const cnv=useRef(null);
  const sim=useMemo(()=>makeSim(N, goal),[N]);

  useEffect(()=>{
    const c=cnv.current; if(!c) return;
    c.width=N; c.height=N;
    const ctx=c.getContext("2d",{alpha:false});
    let down=false;
    const onDown=e=>{ down=true; handle(e,true); };
    const onUp=()=>{ down=false; };
    const onMove=e=>{ if(down) handle(e,false); };
    function handle(e,click){
      const r=c.getBoundingClientRect();
      const x=Math.floor((e.clientX-r.left)/r.width*N);
      const y=Math.floor((e.clientY-r.top)/r.height*N);
      if(e.shiftKey && click){ setGoal([x,y]); return; }
      if(e.altKey && click){ setStart([x,y]); return; }
      paint(sim,x,y,brush, mode==="walls"?2:0);
    }
    c.addEventListener("mousedown",onDown);
    window.addEventListener("mouseup",onUp);
    window.addEventListener("mousemove",onMove);
    return ()=>{ c.removeEventListener("mousedown",onDown); window.removeEventListener("mouseup",onUp); window.removeEventListener("mousemove",onMove); };
  },[sim,N,brush,mode]);

  useEffect(()=>{
    // recompute distances with current goal
    resetDistances(sim, goal);
  },[goal, sim]);

  useEffect(()=>{
    const c=cnv.current; if(!c) return;
    const ctx=c.getContext("2d",{alpha:false});
    let frame;
    const draw=()=>{
      solve(sim,iters);
      render(ctx, sim, start, goal, extractPath(sim, start, goal));
      frame=requestAnimationFrame(draw);
    };
    frame=requestAnimationFrame(draw);
    return ()=>cancelAnimationFrame(frame);
  },[sim,iters,start,goal]);

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">Eikonal Geodesic — walls, start/goal (Shift=goal, Alt=start)</h2>
      <canvas ref={cnv} style={{width:"100%", imageRendering:"pixelated"}}/>
      <div className="grid" style={{gridTemplateColumns:'1fr 320px', gap:16}}>
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <Radio name="mode" value={mode} set={setMode} opts={[["walls","paint walls"],["erase","erase"]]} />
          <Slider label="grid N" v={N} set={setN} min={64} max={256} step={16}/>
          <Slider label="sweeps" v={iters} set={setIters} min={8} max={200} step={4}/>
          <Slider label="brush" v={brush} set={setBrush} min={1} max={10} step={1}/>
          <button className="mt-2 px-3 py-1 rounded bg-white/10 border border-white/10" onClick={()=>{clearWalls(sim); resetDistances(sim, goal);}}>Clear walls</button>
          <p className="text-sm mt-2">Tip: Shift-click sets goal • Alt-click sets start.</p>
        </section>
        <ActiveReflection
          title="Active Reflection — Eikonal Geodesic"
          storageKey="reflect_eikonal_path"
          prompts={[
            "Draw narrow corridors: does the path ‘snap’ to their centerlines?",
            "Move the goal: how does the distance slope steer descent?",
            "Increase sweeps: where do errors/facets reduce most noticeably?"
          ]}
        />
      </div>
    </div>
  );
}

function makeSim(N, goal=[N>>1,N>>1]){
  const u=Array.from({length:N},()=>Array(N).fill(1e6));
  const type=Array.from({length:N},()=>Array(N).fill(0)); // 0 free, 2 wall
  const s={N,u,type}; resetDistances(s, goal); return s;
}
function clearWalls(sim){ const {N,type}=sim; for(let y=0;y<N;y++) for(let x=0;x<N;x++) if(type[y][x]===2) type[y][x]=0; }
function resetDistances(sim, goal){
  const {N,u,type}=sim;
  for(let y=0;y<N;y++) for(let x=0;x<N;x++) u[y][x]=type[y][x]===2?1e6:1e6;
  const [gx,gy]=goal.map(v=>Math.max(0,Math.min(N-1,v)));
  if(type[gy][gx]!==2) u[gy][gx]=0;
}
function paint(sim,x,y,r,kind){
  const {N,type,u}=sim;
  for(let j=-r;j<=r;j++) for(let i=-r;i<=r;i++){
    const X=Math.max(0,Math.min(N-1,x+i)), Y=Math.max(0,Math.min(N-1,y+j));
    if(i*i+j*j<=r*r){ type[Y][X]=kind; if(kind===0 && u[Y][X]===1e6) u[Y][X]=1e6; }
  }
}
function solve(sim,sweeps){
  const {N,u,type}=sim;
  for(let s=0;s<sweeps;s++){
    sweep(0,N,1, 0,N,1); sweep(N-1,-1,-1, 0,N,1);
    sweep(0,N,1, N-1,-1,-1); sweep(N-1,-1,-1, N-1,-1,-1);
  }
  function sweep(x0,x1,dx, y0,y1,dy){
    for(let y=y0;y!=y1;y+=dy) for(let x=x0;x!=x1;x+=dx){
      if(type[y][x]===2) { u[y][x]=1e6; continue; }
      if(u[y][x]===0) continue;
      const ux=Math.min(get(x-1,y), get(x+1,y));
      const uy=Math.min(get(x,y-1), get(x,y+1));
      let a=Math.min(ux,uy), b=Math.max(ux,uy), v;
      if(b-a>=1) v=a+1; else v=(a+b+Math.sqrt(Math.max(0,2-(a-b)*(a-b))))/2;
      if(v<u[y][x]) u[y][x]=v;
    }
  }
  function get(x,y){
    if(x<0||y<0||x>=N||y>=N) return 1e6;
    if(type[y][x]===2) return 1e6;
    return u[y][x];
  }
}
function grad(u,x,y){
  const N=u.length;
  const cx=(u[y][Math.min(N-1,x+1)]-u[y][Math.max(0,x-1)])/2;
  const cy=(u[Math.min(N-1,y+1)][x]-u[Math.max(0,y-1)][x])/2;
  return [cx,cy];
}
function extractPath(sim, start, goal){
  const {u,N,type}=sim;
  let [x,y]=start.map(v=>Math.max(0,Math.min(N-1,Math.round(v))));
  const g=[Math.round(goal[0]),Math.round(goal[1])];
  const path=[[x,y]];
  for(let k=0;k<4000;k++){
    if(x===g[0] && y===g[1]) break;
    const [gx,gy]=grad(u,x,y);
    const len=Math.hypot(gx,gy)||1e-9;
    const nx=x - gx/len, ny=y - gy/len; // steepest descent
    const xi=Math.max(0,Math.min(N-1,Math.round(nx)));
    const yi=Math.max(0,Math.min(N-1,Math.round(ny)));
    if(type[yi][xi]===2) break;
    if(xi===x && yi===y) break;
    x=xi; y=yi; path.push([x,y]);
    if(path.length>1e4) break;
  }
  return path;
}
function render(ctx, sim, start, goal, path){
  const {N,u,type}=sim;
  const img=ctx.createImageData(N,N);
  let mx=0; for(let y=0;y<N;y++) for(let x=0;x<N;x++){ const v=u[y][x]; if(v<1e6) mx=Math.max(mx,v); }
  for(let y=0;y<N;y++) for(let x=0;x<N;x++){
    const off=4*(y*N+x);
    if(type[y][x]===2){ img.data[off]=18; img.data[off+1]=18; img.data[off+2]=24; img.data[off+3]=255; continue; }
    const t=u[y][x]===1e6?0:(u[y][x]/(mx+1e-9));
    const R=Math.floor(50+205*t), G=Math.floor(80+150*(1-t)), B=Math.floor(240*(1-t));
    img.data[off]=R; img.data[off+1]=G; img.data[off+2]=B; img.data[off+3]=255;
  }
  ctx.putImageData(img,0,0);
  // draw path
  ctx.beginPath();
  for(let i=0;i<path.length;i++){
    const [x,y]=path[i];
    if(i===0) ctx.moveTo(x+0.5,y+0.5); else ctx.lineTo(x+0.5,y+0.5);
  }
  ctx.lineWidth=2; ctx.strokeStyle="#fff"; ctx.stroke();
  // draw start/goal
  const drawDot=(p,c)=>{ ctx.fillStyle=c; ctx.fillRect(p[0]-1,p[1]-1,3,3); };
  drawDot(start,"#0ff"); drawDot(goal,"#ff0");
}
function Slider({label,v,set,min,max,step}){
  const show=(typeof v==='number'&&v.toFixed)?v.toFixed(3):v;
  return (<div className="mb-2"><label className="text-sm opacity-80">{label}: <b>{show}</b></label>
    <input className="w-full" type="range" min={min} max={max} step={step}
      value={v} onChange={e=>set(parseFloat(e.target.value))}/></div>);
}
function Radio({name,value,set,opts}){
  return (<div className="flex gap-3 text-sm">
    {opts.map(([val,lab])=><label key={val} className="flex items-center gap-1">
      <input type="radio" name={name} checked={value===val} onChange={()=>set(val)}/>{lab}
    </label>)}
  </div>);
}

