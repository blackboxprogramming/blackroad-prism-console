import { useEffect, useMemo, useRef, useState } from "react";
import ActiveReflection from "./ActiveReflection.jsx";

export default function EikonalLab(){
  const [N,setN]=useState(128);
  const [iters,setIters]=useState(40);
  const [mode,setMode]=useState("sources"); // paint sources vs walls
  const [brush,setBrush]=useState(3);

  const cnv = useRef(null);
  const sim = useMemo(()=>makeSim(N),[N]);

  useEffect(()=>{
    const c=cnv.current; if(!c) return;
    c.width=N; c.height=N;
    const ctx=c.getContext("2d",{alpha:false});

    const draw = ()=>{
      solve(sim, iters);
      render(ctx, sim);
      requestAnimationFrame(draw);
    };
    draw();

    // mouse painting
    let down=false;
    const onDown=e=>{down=true; paintFromEvent(e);};
    const onUp=()=>{down=false;};
    const onMove=e=>{ if(down) paintFromEvent(e); };
    function paintFromEvent(e){
      const r = c.getBoundingClientRect();
      const x = Math.floor((e.clientX - r.left)/r.width*N);
      const y = Math.floor((e.clientY - r.top)/r.height*N);
      paint(sim, x, y, brush, mode==="sources"?"source":"wall");
      // reset distances nearby
      for(let j=-brush-2;j<=brush+2;j++)
        for(let i=-brush-2;i<=brush+2;i++){
          const X=clamp(x+i,0,N-1), Y=clamp(y+j,0,N-1);
          sim.u[Y][X] = sim.type[Y][X]==1 ? 0 : sim.type[Y][X]==2 ? 1e6 : 1e6;
        }
    }
    c.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("mousemove", onMove);
    return ()=>{ c.removeEventListener("mousedown", onDown); window.removeEventListener("mouseup", onUp); window.removeEventListener("mousemove", onMove); };
  },[sim,iters,N,mode,brush]);

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">Eikonal — distance field (fast-sweeping)</h2>
      <canvas ref={cnv} style={{width:"100%", imageRendering:"pixelated"}}/>
      <div className="grid" style={{gridTemplateColumns:"1fr 320px", gap:16}}>
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <Radio name="mode" value={mode} set={setMode} opts={[["sources","paint source (u=0)"],["walls","paint wall (blocked)"]]}/>
          <Slider label="grid N" v={N} set={setN} min={64} max={256} step={16}/>
          <Slider label="sweeps/loop" v={iters} set={setIters} min={4} max={200} step={4}/>
          <Slider label="brush" v={brush} set={setBrush} min={1} max={9} step={1}/>
          <button className="mt-2 px-3 py-1 rounded bg-white/10 border border-white/10" onClick={()=>reset(sim)}>Reset</button>
        </section>
        <ActiveReflection
          title="Active Reflection — Eikonal"
          storageKey="reflect_eikonal"
          prompts={[
            "Paint multiple sources: does the distance field take the minimum of wavefronts?",
            "Add walls: how does the field bend around obstacles?",
            "Increase sweeps: watch the solution tighten near corners."
          ]}
        />
      </div>
    </div>
  );
}

function makeSim(N){
  const u = Array.from({length:N},()=>Array(N).fill(1e6));    // distance
  const type = Array.from({length:N},()=>Array(N).fill(0));   // 0 free, 1 source, 2 wall
  // default: small source in center
  const c=N>>1; type[c][c]=1; u[c][c]=0;
  return {N,u,type};
}
function reset(sim){
  const {N,u,type}=sim;
  for(let y=0;y<N;y++) for(let x=0;x<N;x++){ u[y][x]=1e6; type[y][x]=0; }
  const c=N>>1; type[c][c]=1; u[c][c]=0;
}
function paint(sim, x,y, r, kind){
  const {N,type}=sim;
  for(let j=-r;j<=r;j++) for(let i=-r;i<=r;i++){
    const X=clamp(x+i,0,N-1), Y=clamp(y+j,0,N-1);
    if((i*i+j*j)<=r*r){
      if(kind==="source"){ type[Y][X]=1; }
      else { type[Y][X]=2; }
    }
  }
}
function solve(sim, sweeps){
  const {N,u,type}=sim;
  for(let s=0;s<sweeps;s++){
    // sweep 4 directions
    sweep(0,N,1, 0,N,1);
    sweep(N-1,-1,-1, 0,N,1);
    sweep(0,N,1, N-1,-1,-1);
    sweep(N-1,-1,-1, N-1,-1,-1);
  }
  function sweep(x0,x1,dx, y0,y1,dy){
    for(let y=y0; y!=y1; y+=dy){
      for(let x=x0; x!=x1; x+=dx){
        if(type[y][x]==1){ u[y][x]=0; continue; }
        if(type[y][x]==2){ u[y][x]=1e6; continue; }
        const ux = Math.min(get(x-1,y), get(x+1,y));
        const uy = Math.min(get(x,y-1), get(x,y+1));
        // upwind update (2D)
        let a=Math.min(ux, uy), b=Math.max(ux, uy);
        let val;
        if(b-a >= 1) val = a + 1;
        else {
          // solve (v-a)^2 + (v-b)^2 = 1 -> v = (a+b+sqrt(2- (a-b)^2))/2
          const disc = 2 - (a-b)*(a-b);
          val = (a + b + Math.sqrt(Math.max(0,disc)))/2;
        }
        if(val < u[y][x]) u[y][x]=val;
      }
    }
  }
  function get(x,y){
    if(x<0||x>=N||y<0||y>=N) return 1e6;
    if(type[y][x]==2) return 1e6;
    return u[y][x];
  }
}
function render(ctx, sim){
  const {N,u,type}=sim;
  const img=ctx.createImageData(N,N);
  // find max
  let mx=0; for(let y=0;y<N;y++) for(let x=0;x<N;x++){ const v=u[y][x]; if(v<1e6) mx=Math.max(mx,v); }
  for(let y=0;y<N;y++) for(let x=0;x<N;x++){
    const off=4*(y*N+x);
    if(type[y][x]==2){ img.data[off+0]=15; img.data[off+1]=15; img.data[off+2]=20; img.data[off+3]=255; continue; }
    const v=u[y][x]>=1e6? 0 : u[y][x]/(mx+1e-9);
    // pastel magma-ish
    const R=Math.floor(50+205*v), G=Math.floor(80+150*(1-v)), B=Math.floor(240*(1-v));
    img.data[off]=R; img.data[off+1]=G; img.data[off+2]=B; img.data[off+3]=255;
    if(type[y][x]==1){ img.data[off]=255; img.data[off+1]=255; img.data[off+2]=255; }
  }
  ctx.putImageData(img,0,0);
}
function clamp(x,a,b){ return x<a?a : x>b? b : x; }
function Slider({label,v,set,min,max,step}){
  const show=typeof v==='number'&&v.toFixed ? v.toFixed(3):v;
  return (<div className="mb-2">
    <label className="text-sm opacity-80">{label}: <b>{show}</b></label>
    <input className="w-full" type="range" min={min} max={max} step={step} value={v}
      onChange={e=>set(parseFloat(e.target.value))}/>
  </div>);
}
function Radio({name,value,set,opts}){
  return (<div className="flex gap-3 text-sm">
    {opts.map(([val,lab])=><label key={val} className="flex items-center gap-1">
      <input type="radio" name={name} checked={value===val} onChange={()=>set(val)}/>{lab}
    </label>)}
  </div>);
}

