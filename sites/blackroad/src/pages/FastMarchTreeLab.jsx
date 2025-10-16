import { useEffect, useMemo, useRef, useState } from "react";
import ActiveReflection from "./ActiveReflection.jsx";

export default function FastMarchTreeLab(){
  const [N,setN]=useState(128);
  const [brush,setBrush]=useState(3);
  const [mode,setMode]=useState("sources"); // sources | walls | erase
  const [recompute,setRecompute]=useState(0);
  const cnv=useRef(null);
  const sim=useMemo(()=>makeSim(N),[N]);

  useEffect(()=>{
    const c=cnv.current; if(!c) return; c.width=N; c.height=N;
    const ctx=c.getContext("2d",{alpha:false});
    let down=false;
    const paintEvt=(e)=>{
      const r=c.getBoundingClientRect();
      const x=Math.floor((e.clientX-r.left)/r.width*N);
      const y=Math.floor((e.clientY-r.top)/r.height*N);
      if(mode==="sources") paint(sim,x,y,brush,1);
      else if(mode==="walls") paint(sim,x,y,brush,2);
      else paint(sim,x,y,brush,0);
      setRecompute(t=>t+1);
    };
    const onDown=e=>{ down=true; paintEvt(e); };
    const onUp=()=>{ down=false; };
    const onMove=e=>{ if(down) paintEvt(e); };
    c.addEventListener("mousedown",onDown);
    window.addEventListener("mouseup",onUp);
    window.addEventListener("mousemove",onMove);
    return ()=>{ c.removeEventListener("mousedown",onDown); window.removeEventListener("mouseup",onUp); window.removeEventListener("mousemove",onMove); };
  },[sim,N,mode,brush]);

  useEffect(()=>{
    const c=cnv.current; if(!c) return;
    const ctx=c.getContext("2d",{alpha:false});
    const {dist,parent}=dijkstra(sim);
    render(ctx, sim, dist, parent);
  },[sim, recompute]);

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">Fast-Marching Path Tree — multi-source Dijkstra</h2>
      <canvas ref={cnv} style={{width:"100%", imageRendering:"pixelated"}}/>
      <div className="grid" style={{gridTemplateColumns:'1fr 340px', gap:16}}>
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <Radio name="mode" value={mode} set={setMode} opts={[["sources","paint sources"],["walls","paint walls"],["erase","erase"]]} />
          <Slider label="grid N" v={N} set={setN} min={64} max={256} step={16}/>
          <Slider label="brush" v={brush} set={setBrush} min={1} max={10} step={1}/>
          <button className="mt-2 px-3 py-1 rounded bg-white/10 border border-white/10" onClick={()=>{reset(sim); setRecompute(t=>t+1);}}>Reset</button>
        </section>
        <ActiveReflection
          title="Active Reflection — Fast March Tree"
          storageKey="reflect_fmm_tree"
          prompts={[
            "Add multiple sources: how do basin boundaries meet (Voronoi-like)?",
            "Draw labyrinth walls: the tree hugs corridor centerlines.",
            "Erase a source: which sub-tree reroutes the farthest?"
          ]}
        />
      </div>
    </div>
  );
}

function makeSim(N){
  const type = Array.from({length:N},()=>Array(N).fill(0)); // 0 free, 1 source, 2 wall
  type[N>>1][N>>1]=1;
  return {N,type};
}
function reset(sim){
  const {N,type}=sim;
  for(let y=0;y<N;y++) for(let x=0;x<N;x++) type[y][x]=0;
  type[N>>1][N>>1]=1;
}
function paint(sim,x,y,r,kind){
  const {N,type}=sim;
  for(let j=-r;j<=r;j++) for(let i=-r;i<=r;i++){
    const X=Math.max(0,Math.min(N-1,x+i)), Y=Math.max(0,Math.min(N-1,y+j));
    if(i*i+j*j<=r*r) type[Y][X]=kind;
  }
}
function dijkstra(sim){
  const {N,type}=sim;
  const INF=1e9;
  const dist=Array.from({length:N},()=>Array(N).fill(INF));
  const parent=Array.from({length:N},()=>Array(N).fill(null));
  const heap=[]; // binary heap (min)
  const push=(d,x,y)=>{ heap.push([d,x,y]); up(heap.length-1); };
  const up=(i)=>{ while(i>0){ const p=(i-1)>>1; if(heap[p][0]<=heap[i][0]) break; [heap[p],heap[i]]=[heap[i],heap[p]]; i=p; } };
  const pop=()=>{ const r=heap[0]; const v=heap.pop(); if(heap.length){ heap[0]=v; down(0); } return r; };
  const down=(i)=>{ while(true){ let l=i*2+1,r=i*2+2,m=i; if(l<heap.length&&heap[l][0]<heap[m][0]) m=l; if(r<heap.length&&heap[r][0]<heap[m][0]) m=r; if(m===i) break; [heap[i],heap[m]]=[heap[m],heap[i]]; i=m; } };
  // init with all sources
  for(let y=0;y<N;y++) for(let x=0;x<N;x++){
    if(type[y][x]===1){ dist[y][x]=0; push(0,x,y); }
  }
  const dirs=[[1,0],[-1,0],[0,1],[0,-1]];
  while(heap.length){
    const [d,x,y]=pop();
    if(d!==dist[y][x]) continue;
    for(const [dx,dy] of dirs){
      const X=x+dx, Y=y+dy;
      if(X<0||Y<0||X>=N||Y>=N) continue;
      if(type[Y][X]===2) continue;
      const w=1; // unit speed
      if(d+w < dist[Y][X]){
        dist[Y][X]=d+w;
        parent[Y][X]=[x,y];
        push(d+w, X, Y);
      }
    }
  }
  return {dist,parent};
}
function render(ctx, sim, dist, parent){
  const {N,type}=sim;
  const img=ctx.createImageData(N,N);
  let mx=0; for(let y=0;y<N;y++) for(let x=0;x<N;x++) if(dist[y][x]<1e9) mx=Math.max(mx, dist[y][x]);
  for(let y=0;y<N;y++) for(let x=0;x<N;x++){
    const off=4*(y*N+x);
    if(type[y][x]===2){ img.data[off]=18; img.data[off+1]=18; img.data[off+2]=24; img.data[off+3]=255; continue; }
    const t = dist[y][x]>=1e9 ? 0 : dist[y][x]/(mx+1e-9);
    const R=Math.floor(50+205*t), G=Math.floor(80+150*(1-t)), B=Math.floor(240*(1-t));
    img.data[off]=R; img.data[off+1]=G; img.data[off+2]=B; img.data[off+3]=255;
  }
  ctx.putImageData(img,0,0);
  // tree overlay
  ctx.strokeStyle="#fff"; ctx.lineWidth=1;
  ctx.beginPath();
  for(let y=0;y<N;y++) for(let x=0;x<N;x++){
    const p=parent[y][x]; if(!p) continue;
    ctx.moveTo(x+0.5,y+0.5); ctx.lineTo(p[0]+0.5,p[1]+0.5);
  }
  ctx.stroke();
}
function Slider({label,v,set,min,max,step}){
  const show=(typeof v==='number'&&v.toFixed)?v.toFixed(3):v;
  return (<div className="mb-2"><label className="text-sm opacity-80">{label}: <b>{show}</b></label>
  <input className="w-full" type="range" min={min} max={max} step={step}
    value={v} onChange={e=>set(parseFloat(e.target.value))}/></div>);
}
function Radio({name,value,set,opts}){
  return (<div className="flex gap-3 text-sm">
    {opts.map(([val,lab])=> <label key={val} className="flex items-center gap-1">
      <input type="radio" name={name} checked={value===val} onChange={()=>set(val)}/>{lab}
    </label>)}
  </div>);
}

