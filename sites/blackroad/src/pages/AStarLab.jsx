import { useEffect, useMemo, useRef, useState } from "react";
import ActiveReflection from "./ActiveReflection.jsx";

function heapPush(h, node){ h.push(node); up(h, h.length-1); }
function up(h,i){ while(i>0){ const p=(i-1)>>1; if(h[p].prio<=h[i].prio) break; [h[p],h[i]]=[h[i],h[p]]; i=p; } }
function heapPop(h){ if(!h.length) return null; const r=h[0]; const v=h.pop(); if(h.length){ h[0]=v; down(h,0); } return r; }
function down(h,i){ for(;;){ let l=i*2+1,r=i*2+2,m=i; if(l<h.length&&h[l].prio<h[m].prio) m=l; if(r<h.length&&h[r].prio<h[m].prio) m=r; if(m===i) break; [h[i],h[m]]=[h[m],h[i]]; i=m; } }

export default function AStarLab(){
  const [N,setN]=useState(160);
  const [brush,setBrush]=useState(3);
  const [mode,setMode]=useState("wall"); // wall | erase
  const [heur,setHeur]=useState(true);   // on = A*, off = Dijkstra
  const [start,setStart]=useState([16,16]);
  const [goal,setGoal]=useState([140,120]);

  const cnv=useRef(null);
  const world=useMemo(()=> makeWorld(N),[N]);

  // mouse interactions
  useEffect(()=>{
    const c=cnv.current; if(!c) return; c.width=N; c.height=N;
    const R=()=>c.getBoundingClientRect();
    let down=false;
    const P=e=>({x:Math.max(0,Math.min(N-1, Math.floor((e.clientX-R().left)/R().width*N))),
                 y:Math.max(0,Math.min(N-1, Math.floor((e.clientY-R().top )/R().height*N)))});
    const paint=(x,y)=>{
      for(let j=-brush;j<=brush;j++) for(let i=-brush;i<=brush;i++){
        if(i*i+j*j>brush*brush) continue;
        const X=Math.max(0,Math.min(N-1,x+i)), Y=Math.max(0,Math.min(N-1,y+j));
        world.wall[Y][X] = (mode==="wall") ? 1 : 0;
      }
    };
    const md=e=>{
      down=true; const p=P(e);
      if(e.shiftKey){ setGoal([p.x,p.y]); return; }
      if(e.altKey){ setStart([p.x,p.y]); return; }
      paint(p.x,p.y);
    };
    const mv=e=>{ if(!down) return; const p=P(e); paint(p.x,p.y); };
    const mu=()=>{ down=false; };
    c.addEventListener("mousedown",md); window.addEventListener("mousemove",mv); window.addEventListener("mouseup",mu);
    return ()=>{ c.removeEventListener("mousedown",md); window.removeEventListener("mousemove",mv); window.removeEventListener("mouseup",mu); };
  },[world,mode,brush,N]);

  const result = useMemo(()=> runSearch(world, start, goal, heur),[world,start,goal,heur]);

  useEffect(()=>{
    const c=cnv.current; if(!c) return; const ctx=c.getContext("2d",{alpha:false});
    render(ctx, world, result, start, goal);
  },[world,result,start,goal]);

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">A* vs Dijkstra — Grid Pathfinding</h2>
      <canvas ref={cnv} style={{width:"100%", imageRendering:"pixelated"}}/>
      <div className="grid" style={{gridTemplateColumns:'1fr 360px', gap:16}}>
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <button className="px-2 py-1 rounded bg-white/10 border border-white/10" onClick={()=>reset(world)}>Reset</button>
          <div className="mt-2 text-sm flex gap-3">
            <label><input type="radio" checked={mode==="wall"} onChange={()=>setMode("wall")}/> wall</label>
            <label><input type="radio" checked={mode==="erase"} onChange={()=>setMode("erase")}/> erase</label>
          </div>
          <p className="text-xs opacity-70 mt-2">Shift-click: set goal • Alt-click: set start</p>
        </section>
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <Slider label="grid N" v={N} set={setN} min={96} max={224} step={16}/>
          <Slider label="brush" v={brush} set={setBrush} min={1} max={10} step={1}/>
          <label className="text-sm flex items-center gap-2 mt-1">
            <input type="checkbox" checked={heur} onChange={()=>setHeur(v=>!v)}/> Use heuristic (A*) — off = Dijkstra
          </label>
          <p className="text-sm mt-2">Visited: <b>{result.visited}</b> • Path len: <b>{result.path.length}</b></p>
          <ActiveReflection
            title="Active Reflection — A* vs Dijkstra"
            storageKey="reflect_astar"
            prompts={[
              "Turn heuristic off: expansions explode but path stays same.",
              "Find mazes where A*’s gain is massive vs straight corridors.",
              "Heuristic = Manhattan; when is it admissible/tight?"
            ]}
          />
        </section>
      </div>
    </div>
  );
}

function makeWorld(N){ return {N, wall: Array.from({length:N},()=>Array(N).fill(0))}; }
function reset(world){ const {N,wall}=world; for(let y=0;y<N;y++) for(let x=0;x<N;x++) wall[y][x]=0; }

function runSearch(world, start, goal, useHeur){
  const {N,wall}=world;
  const g=Array.from({length:N},()=>Array(N).fill(Infinity));
  const came=Array.from({length:N},()=>Array(N).fill(null));
  const open=[]; const h=(x,y)=> Math.abs(x-goal[0])+Math.abs(y-goal[1]);
  const s={x:start[0],y:start[1],prio:0}; g[start[1]][start[0]]=0; heapPush(open,s);
  let visited=0;
  while(open.length){
    const cur=heapPop(open); visited++; if(cur.x===goal[0]&&cur.y===goal[1]) break;
    const dirs=[[1,0],[-1,0],[0,1],[0,-1]];
    for(const [dx,dy] of dirs){
      const X=cur.x+dx, Y=cur.y+dy;
      if(X<0||Y<0||X>=N||Y>=N) continue;
      if(wall[Y][X]) continue;
      const newg=g[cur.y][cur.x]+1;
      if(newg<g[Y][X]){
        g[Y][X]=newg; came[Y][X]=[cur.x,cur.y];
        const f=newg + (useHeur ? h(X,Y) : 0);
        heapPush(open, {x:X,y:Y,prio:f});
      }
    }
  }
  // reconstruct
  const path=[]; let x=goal[0], y=goal[1];
  if(!Number.isFinite(g[y][x])) return {path, visited, g};
  while(!(x===start[0]&&y===start[1])){
    path.push([x,y]); const p=came[y][x]; if(!p) break; [x,y]=p;
  }
  path.push([start[0],start[1]]); path.reverse();
  return {path, visited, g};
}

function render(ctx, world, result, start, goal){
  const {N,wall}=world; const {g,path}=result;
  const img=ctx.createImageData(N,N);
  let mx=0; for(let y=0;y<N;y++) for(let x=0;x<N;x++){ const v=g[y][x]; if(Number.isFinite(v)) mx=Math.max(mx,v); }
  for(let y=0;y<N;y++){
    for(let x=0;x<N;x++){
      const off=4*(y*N+x);
      if(wall[y][x]){ img.data[off]=18; img.data[off+1]=18; img.data[off+2]=24; img.data[off+3]=255; continue; }
      if(Number.isFinite(g[y][x])){
        const t=g[y][x]/(mx+1e-9);
        img.data[off]=Math.floor(50+205*t);
        img.data[off+1]=Math.floor(80+150*(1-t));
        img.data[off+2]=Math.floor(240*(1-t));
      }else{
        img.data[off]=40; img.data[off+1]=50; img.data[off+2]=60;
      }
      img.data[off+3]=255;
    }
  }
  ctx.putImageData(img,0,0);
  // path
  if(path.length){
    ctx.strokeStyle="#fff"; ctx.lineWidth=2; ctx.beginPath();
    for(let i=0;i<path.length;i++){ const [x,y]=path[i]; if(i===0) ctx.moveTo(x+0.5,y+0.5); else ctx.lineTo(x+0.5,y+0.5); }
    ctx.stroke();
  }
  // start/goal
  ctx.fillStyle="#0ff"; ctx.fillRect(start[0]-1,start[1]-1,3,3);
  ctx.fillStyle="#ff0"; ctx.fillRect(goal[0]-1,goal[1]-1,3,3);
}

function Slider({label,v,set,min,max,step}){
  const show = (typeof v==='number'&&v.toFixed) ? v.toFixed(2) : v;
  return (<div className="mb-2"><label className="text-sm opacity-80">{label}: <b>{show}</b></label>
    <input className="w-full" type="range" min={min} max={max} step={step}
      value={v} onChange={e=>set(parseFloat(e.target.value))}/></div>);
}

