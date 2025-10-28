import { useEffect, useMemo, useRef, useState } from 'react';
import ActiveReflection from './ActiveReflection.jsx';

/** Paint walls; Shift-click goal, Alt-click start.
 *  Compute integer distance via BFS (4-neighbor), then steepest descent path. */
export default function BrushfirePathLab() {
  const [N, setN] = useState(160);
  const [brush, setBrush] = useState(3);
  const [mode, setMode] = useState('wall'); // wall | erase
  const [start, setStart] = useState([16, 16]);
  const [goal, setGoal] = useState([140, 120]);

  const cnv = useRef(null);
  const sim = useMemo(() => makeGrid(N), [N]);

  // mouse paint + set start/goal
  useEffect(() => {
    const c = cnv.current;
    if (!c) return;
    c.width = N;
    c.height = N;
    const rect = () => c.getBoundingClientRect();
    let down = false;
    const pos = (e) => ({
      x: Math.max(
        0,
        Math.min(
          N - 1,
          Math.floor(((e.clientX - rect().left) / rect().width) * N)
        )
      ),
      y: Math.max(
        0,
        Math.min(
          N - 1,
          Math.floor(((e.clientY - rect().top) / rect().height) * N)
        )
      ),
    });
    const md = (e) => {
      down = true;
      const p = pos(e);
      if (e.shiftKey) {
        setGoal([p.x, p.y]);
        return;
      }
      if (e.altKey) {
        setStart([p.x, p.y]);
        return;
      }
      paint(sim, p.x, p.y, brush, mode === 'wall' ? 1 : 0);
    };
    const mv = (e) => {
      if (!down) return;
      const p = pos(e);
      paint(sim, p.x, p.y, brush, mode === 'wall' ? 1 : 0);
    };
    const mu = () => {
      down = false;
    };
    c.addEventListener('mousedown', md);
    window.addEventListener('mousemove', mv);
    window.addEventListener('mouseup', mu);
    return () => {
      c.removeEventListener('mousedown', md);
      window.removeEventListener('mousemove', mv);
      window.removeEventListener('mouseup', mu);
    };
  }, [sim, mode, brush, N]);

  const { dist, path } = useMemo(() => {
    const dist = bfs(sim, start, goal);
    const p = extract(sim, dist, start, goal);
    return { dist, path: p };
  }, [sim, start, goal]);

  useEffect(() => {
    const c = cnv.current;
    if (!c) return;
    const ctx = c.getContext('2d', { alpha: false });
    render(ctx, sim, dist, path, start, goal);
  }, [sim, dist, path, start, goal]);

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">
        Voronoi / Brushfire Path — BFS distance
      </h2>
      <canvas
        ref={cnv}
        style={{ width: '100%', imageRendering: 'pixelated' }}
      />
      <div
        className="grid"
        style={{ gridTemplateColumns: '1fr 360px', gap: 16 }}
      >
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <button
            className="px-3 py-1 rounded bg-white/10 border border-white/10"
            onClick={() => reset(sim)}
          >
            Reset
          </button>
          <div className="mt-2 text-sm flex gap-3">
            <label>
              <input
                type="radio"
                checked={mode === 'wall'}
                onChange={() => setMode('wall')}
              />{' '}
              wall
            </label>
            <label>
              <input
                type="radio"
                checked={mode === 'erase'}
                onChange={() => setMode('erase')}
              />{' '}
              erase
            </label>
          </div>
        </section>
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <Slider
            label="grid N"
            v={N}
            set={setN}
            min={96}
            max={224}
            step={16}
          />
          <Slider
            label="brush"
            v={brush}
            set={setBrush}
            min={1}
            max={10}
            step={1}
          />
          <p className="text-xs opacity-70 mt-2">
            Shift-click to set <b>goal</b>, Alt-click to set <b>start</b>.
          </p>
import { useEffect, useMemo, useRef, useState } from "react";
import ActiveReflection from "./ActiveReflection.jsx";

/** Paint walls; Shift-click goal, Alt-click start.
 *  Compute integer distance via BFS (4-neighbor), then steepest descent path. */
export default function BrushfirePathLab(){
  const [N,setN]=useState(160);
  const [brush,setBrush]=useState(3);
  const [mode,setMode]=useState("wall"); // wall | erase
  const [start,setStart]=useState([16,16]);
  const [goal,setGoal]=useState([140,120]);

  const cnv=useRef(null);
  const sim=useMemo(()=> makeGrid(N),[N]);

  // mouse paint + set start/goal
  useEffect(()=>{
    const c=cnv.current; if(!c) return; c.width=N; c.height=N;
    const rect=()=>c.getBoundingClientRect();
    let down=false;
    const pos=(e)=>({x:Math.max(0,Math.min(N-1,Math.floor((e.clientX-rect().left)/rect().width*N))),
                     y:Math.max(0,Math.min(N-1,Math.floor((e.clientY-rect().top )/rect().height*N)))});
    const md=(e)=>{ down=true; const p=pos(e);
      if(e.shiftKey){ setGoal([p.x,p.y]); return; }
      if(e.altKey){ setStart([p.x,p.y]); return; }
      paint(sim,p.x,p.y,brush, mode==="wall"?1:0);
    };
    const mv=(e)=>{ if(!down) return; const p=pos(e); paint(sim,p.x,p.y,brush, mode==="wall"?1:0); };
    const mu=()=>{ down=false; };
    c.addEventListener("mousedown",md); window.addEventListener("mousemove",mv); window.addEventListener("mouseup",mu);
    return ()=>{ c.removeEventListener("mousedown",md); window.removeEventListener("mousemove",mv); window.removeEventListener("mouseup",mu); };
  },[sim,mode,brush,N]);

  const {dist, path} = useMemo(()=>{
    const dist=bfs(sim,start,goal);
    const p = extract(sim, dist, start, goal);
    return {dist, path:p};
  },[sim,start,goal]);

  useEffect(()=>{
    const c=cnv.current; if(!c) return; const ctx=c.getContext("2d",{alpha:false});
    render(ctx, sim, dist, path, start, goal);
  },[sim,dist,path,start,goal]);

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">Voronoi / Brushfire Path — BFS distance</h2>
      <canvas ref={cnv} style={{width:"100%", imageRendering:"pixelated"}}/>
      <div className="grid" style={{gridTemplateColumns:"1fr 360px", gap:16}}>
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <button className="px-3 py-1 rounded bg-white/10 border border-white/10" onClick={()=>reset(sim)}>Reset</button>
          <div className="mt-2 text-sm flex gap-3">
            <label><input type="radio" checked={mode==="wall"} onChange={()=>setMode("wall")}/> wall</label>
            <label><input type="radio" checked={mode==="erase"} onChange={()=>setMode("erase")}/> erase</label>
          </div>
        </section>
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <Slider label="grid N" v={N} set={setN} min={96} max={224} step={16}/>
          <Slider label="brush" v={brush} set={setBrush} min={1} max={10} step={1}/>
          <p className="text-xs opacity-70 mt-2">Shift-click to set <b>goal</b>, Alt-click to set <b>start</b>.</p>
          <ActiveReflection
            title="Active Reflection — Brushfire"
            storageKey="reflect_brushfire"
            prompts={[
              'Corridors centerline effect: path hugs cells of increasing distance.',
              'Obstacles split distance fronts like Voronoi bisectors.',
              'How does path differ from continuous eikonal geodesic?',
              "Corridors centerline effect: path hugs cells of increasing distance.",
              "Obstacles split distance fronts like Voronoi bisectors.",
              "How does path differ from continuous eikonal geodesic?"
            ]}
          />
        </section>
      </div>
    </div>
  );
}

function makeGrid(N) {
  const occ = Array.from({ length: N }, () => Array(N).fill(0));
  return { N, occ };
}
function reset(sim) {
  const { N, occ } = sim;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) occ[y][x] = 0;
}
function paint(sim, x, y, r, val) {
  const { N, occ } = sim;
  for (let j = -r; j <= r; j++)
    for (let i = -r; i <= r; i++) {
      const X = Math.max(0, Math.min(N - 1, x + i)),
        Y = Math.max(0, Math.min(N - 1, y + j));
      if (i * i + j * j <= r * r) occ[Y][X] = val;
    }
}
function bfs(sim, start, goal) {
  const { N, occ } = sim;
  const INF = 1e9;
  const d = Array.from({ length: N }, () => Array(N).fill(INF));
  const q = [];
  const push = (x, y) => {
    d[y][x] = 0;
    q.push([x, y]);
  };
  push(goal[0], goal[1]);
  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];
  while (q.length) {
    const [x, y] = q.shift();
    for (const [dx, dy] of dirs) {
      const X = x + dx,
        Y = y + dy;
      if (X < 0 || Y < 0 || X >= N || Y >= N) continue;
      if (occ[Y][X]) continue; // blocked
      const nd = d[y][x] + 1;
      if (nd < d[Y][X]) {
        d[Y][X] = nd;
        q.push([X, Y]);
      }
function makeGrid(N){
  const occ=Array.from({length:N},()=>Array(N).fill(0));
  return {N, occ};
}
function reset(sim){ const {N,occ}=sim; for(let y=0;y<N;y++) for(let x=0;x<N;x++) occ[y][x]=0; }
function paint(sim,x,y,r, val){
  const {N,occ}=sim; for(let j=-r;j<=r;j++) for(let i=-r;i<=r;i++){
    const X=Math.max(0,Math.min(N-1,x+i)), Y=Math.max(0,Math.min(N-1,y+j));
    if(i*i+j*j<=r*r) occ[Y][X]=val;
  }
}
function bfs(sim,start,goal){
  const {N,occ}=sim; const INF=1e9;
  const d=Array.from({length:N},()=>Array(N).fill(INF));
  const q=[]; const push=(x,y)=>{d[y][x]=0; q.push([x,y]);};
  push(goal[0],goal[1]);
  const dirs=[[1,0],[-1,0],[0,1],[0,-1]];
  while(q.length){
    const [x,y]=q.shift();
    for(const [dx,dy] of dirs){
      const X=x+dx, Y=y+dy;
      if(X<0||Y<0||X>=N||Y>=N) continue;
      if(occ[Y][X]) continue; // blocked
      const nd=d[y][x]+1;
      if(nd<d[Y][X]){ d[Y][X]=nd; q.push([X,Y]); }
    }
  }
  return d;
}
function extract(sim, d, start, goal) {
  const { N, occ } = sim;
  const path = [];
  let [x, y] = start.map(Math.round);
  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];
  if (d[y][x] === 1e9) return path;
  path.push([x, y]);
  for (let k = 0; k < N * N; k++) {
    if (x === goal[0] && y === goal[1]) break;
    let best = [x, y],
      bd = d[y][x];
    for (const [dx, dy] of dirs) {
      const X = x + dx,
        Y = y + dy;
      if (X < 0 || Y < 0 || X >= N || Y >= N) continue;
      if (d[Y][X] < bd) {
        bd = d[Y][X];
        best = [X, Y];
      }
    }
    if (best[0] === x && best[1] === y) break;
    [x, y] = best;
    path.push([x, y]);
  }
  return path;
}
function render(ctx, sim, d, path, start, goal) {
  const { N, occ } = sim;
  const img = ctx.createImageData(N, N);
  let mx = 0;
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) if (d[y][x] < 1e9) mx = Math.max(mx, d[y][x]);
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const off = 4 * (y * N + x);
      if (occ[y][x]) {
        img.data[off] = 18;
        img.data[off + 1] = 18;
        img.data[off + 2] = 24;
        img.data[off + 3] = 255;
        continue;
      }
      const t = d[y][x] === 1e9 ? 0 : d[y][x] / (mx + 1e-9);
      img.data[off] = Math.floor(50 + 205 * t);
      img.data[off + 1] = Math.floor(80 + 150 * (1 - t));
      img.data[off + 2] = Math.floor(240 * (1 - t));
      img.data[off + 3] = 255;
    }
  ctx.putImageData(img, 0, 0);
  // path
  if (path.length) {
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < path.length; i++) {
      const [x, y] = path[i];
      if (i === 0) ctx.moveTo(x + 0.5, y + 0.5);
      else ctx.lineTo(x + 0.5, y + 0.5);
    }
    ctx.stroke();
  }
  // start/goal
  ctx.fillStyle = '#0ff';
  ctx.fillRect(start[0] - 1, start[1] - 1, 3, 3);
  ctx.fillStyle = '#ff0';
  ctx.fillRect(goal[0] - 1, goal[1] - 1, 3, 3);
}
function Slider({ label, v, set, min, max, step }) {
  const show = typeof v === 'number' && v.toFixed ? v.toFixed(2) : v;
  return (
    <div className="mb-2">
      <label className="text-sm opacity-80">
        {label}: <b>{show}</b>
      </label>
      <input
        className="w-full"
        type="range"
        min={min}
        max={max}
        step={step}
        value={v}
        onChange={(e) => set(parseFloat(e.target.value))}
      />
    </div>
  );
function extract(sim, d, start, goal){
  const {N,occ}=sim; const path=[];
  let [x,y]=start.map(Math.round);
  const dirs=[[1,0],[-1,0],[0,1],[0,-1]];
  if(d[y][x]===1e9) return path;
  path.push([x,y]);
  for(let k=0;k<N*N;k++){
    if(x===goal[0] && y===goal[1]) break;
    let best=[x,y], bd=d[y][x];
    for(const [dx,dy] of dirs){
      const X=x+dx, Y=y+dy;
      if(X<0||Y<0||X>=N||Y>=N) continue;
      if(d[Y][X]<bd){ bd=d[Y][X]; best=[X,Y]; }
    }
    if(best[0]===x && best[1]===y) break;
    [x,y]=best; path.push([x,y]);
  }
  return path;
}
function render(ctx, sim, d, path, start, goal){
  const {N,occ}=sim;
  const img=ctx.createImageData(N,N);
  let mx=0; for(let y=0;y<N;y++) for(let x=0;x<N;x++) if(d[y][x]<1e9) mx=Math.max(mx,d[y][x]);
  for(let y=0;y<N;y++) for(let x=0;x<N;x++){
    const off=4*(y*N+x);
    if(occ[y][x]){ img.data[off]=18; img.data[off+1]=18; img.data[off+2]=24; img.data[off+3]=255; continue; }
    const t=d[y][x]===1e9? 0 : d[y][x]/(mx+1e-9);
    img.data[off]=Math.floor(50+205*t);
    img.data[off+1]=Math.floor(80+150*(1-t));
    img.data[off+2]=Math.floor(240*(1-t));
    img.data[off+3]=255;
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
function Slider({label,v,set,min,max,step}){ const show=(typeof v==="number"&&v.toFixed)?v.toFixed(2):v;
  return (<div className="mb-2"><label className="text-sm opacity-80">{label}: <b>{show}</b></label>
  <input className="w-full" type="range" min={min} max={max} step={step}
         value={v} onChange={e=>set(parseFloat(e.target.value))}/></div>);
}
