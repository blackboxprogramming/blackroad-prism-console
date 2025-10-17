import { useEffect, useMemo, useRef, useState } from "react";
import ActiveReflection from "./ActiveReflection.jsx";

/** DLA on a square grid:
 *  - Seed at center.
 *  - Random walkers spawn on a ring; stick if neighbor to cluster.
 *  - Gentle, meditative growth.
 */
function rng(seed){ let s=seed|0||2025; return ()=> (s=(1664525*s+1013904223)>>>0)/2**32; }

export default function DLALab(){
  const [N,setN]=useState(220);
  const [seed,setSeed]=useState(7);
  const [spawnR,setSpawnR]=useState(90);
  const [stepsPerFrame,setSPF]=useState(800);
  const [running,setRunning]=useState(true);

  const cnv=useRef(null);
  const sim = useMemo(()=> makeSim(N, seed, spawnR), [N,seed,spawnR]);

  useEffect(()=>{
    const c=cnv.current; if(!c) return;
    c.width=N; c.height=N;
    const ctx=c.getContext("2d", {alpha:false});
    let raf;
    const loop=()=>{
      if(running){
        for(let k=0;k<stepsPerFrame;k++) tick(sim);
      }
      render(ctx, sim);
      raf=requestAnimationFrame(loop);
    };
    loop(); return ()=>cancelAnimationFrame(raf);
  },[sim, running, stepsPerFrame]);

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">Diffusion-Limited Aggregation — Snowflake</h2>
      <canvas ref={cnv} style={{width:"100%", imageRendering:"pixelated"}}/>
      <div className="grid" style={{gridTemplateColumns:'1fr 320px', gap:16}}>
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <div className="flex gap-2">
            <button className="px-3 py-1 rounded bg-white/10 border border-white/10" onClick={()=>setRunning(r=>!r)}>
              {running? "Pause":"Run"}
            </button>
            <button className="px-3 py-1 rounded bg-white/10 border border-white/10" onClick={()=>{
              const s = makeSim(N, seed, spawnR); Object.assign(sim, s);
            }}>Reset</button>
          </div>
          <Slider label="grid N" v={N} set={setN} min={140} max={320} step={10}/>
          <Slider label="spawn radius" v={spawnR} set={setSpawnR} min={40} max={Math.floor(N/2)-10} step={2}/>
          <Slider label="steps/frame" v={stepsPerFrame} set={setSPF} min={50} max={4000} step={50}/>
          <Slider label="seed" v={seed} set={setSeed} min={1} max={9999} step={1}/>
        </section>
        <ActiveReflection
          title="Active Reflection — DLA"
          storageKey="reflect_dla"
          prompts={[
            "Increase spawn radius: does the aggregate become more delicate?",
            "Pause & step fast: do you notice side-branching ‘tip splitting’?",
            "Reset with different seed: how stable is overall morphology?"
          ]}
        />
      </div>
    </div>
  );
}

function makeSim(N, seed, R){
  const r=rng(seed); const grid=new Uint8Array(N*N);
  const cx=N>>1, cy=N>>1;
  grid[cy*N+cx]=1; // seed
  return {N, grid, cx, cy, r, R, maxR:1};
}
function tick(sim){
  const {N,grid,cx,cy,R,r} = sim;
  // spawn on circle radius R around center
  const ang = r()*Math.PI*2;
  let x = Math.round(cx + R*Math.cos(ang));
  let y = Math.round(cy + R*Math.sin(ang));
  const maxWalk = 8000;
  for(let steps=0; steps<maxWalk; steps++){
    // random step
    const t = r();
    if(t<0.25) x++; else if(t<0.5) x--; else if(t<0.75) y++; else y--;
    // kill if far away
    if((x-cx)**2 + (y-cy)**2 > (R+20)**2){ return; }
    // clamp to bounds
    if(x<=1||x>=N-2||y<=1||y>=N-2) continue;
    // stick if neighbor occupied
    const k=y*N+x;
    if(grid[k-1]||grid[k+1]||grid[k-N]||grid[k+N]||grid[k-N-1]||grid[k-N+1]||grid[k+N-1]||grid[k+N+1]){
      grid[k]=1; return;
    }
  }
}
function render(ctx, sim){
  const {N,grid}=sim;
  const img=ctx.createImageData(N,N);
  for(let y=0;y<N;y++){
    for(let x=0;x<N;x++){
      const v = grid[y*N+x];
      const off=4*(y*N+x);
      if(v){
        img.data[off+0]=220; img.data[off+1]=240; img.data[off+2]=255; img.data[off+3]=255;
      }else{
        img.data[off+0]=10; img.data[off+1]=12; img.data[off+2]=18; img.data[off+3]=255;
      }
    }
  }
  ctx.putImageData(img,0,0);
}
function Slider({label,v,set,min,max,step}){
  const show = (typeof v==='number'&&v.toFixed) ? v.toFixed(2) : v;
  return (<div className="mb-2"><label className="text-sm opacity-80">{label}: <b>{show}</b></label>
    <input className="w-full" type="range" min={min} max={max} step={step} value={v}
      onChange={e=>set(parseFloat(e.target.value))}/></div>);
}
