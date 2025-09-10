import { useEffect, useMemo, useRef, useState } from "react";
import ActiveReflection from "./ActiveReflection.jsx";

/** Solve ∇²φ = 0 with Dirichlet “conductors” (fixed φ). Gauss–Seidel sweeps. */
export default function LaplaceConductorsLab(){
  const [N,setN]=useState(160);
  const [volts,setVolts]=useState(1.0);     // paint potential
  const [mode,setMode]=useState("paint");    // paint | erase
  const [sweeps,setSweeps]=useState(40);     // per frame
  const [arrows,setArrows]=useState(18);     // field arrows
  const cnv=useRef(null);
  const sim=useMemo(()=> makeSim(N),[N]);

  // UI painting
  useEffect(()=>{
    const c=cnv.current; if(!c) return; c.width=N; c.height=N;
    const rect=()=>c.getBoundingClientRect();
    let down=false;
    const pos=e=>({x:Math.max(0,Math.min(N-1, Math.floor((e.clientX-rect().left)/rect().width*N))),
                   y:Math.max(0,Math.min(N-1, Math.floor((e.clientY-rect().top )/rect().height*N)))});
    const paint=(x,y)=>{
      const r=4;
      for(let j=-r;j<=r;j++) for(let i=-r;i<=r;i++){
        const X=Math.max(0,Math.min(N-1,x+i)), Y=Math.max(0,Math.min(N-1,y+j));
        if(i*i+j*j<=r*r){
          if(mode==="paint"){ sim.mask[Y][X]=true; sim.phi[Y][X]=volts; }
          else { sim.mask[Y][X]=false; }
        }
      }
    };
    const mdown=e=>{ down=true; const p=pos(e); paint(p.x,p.y); };
    const mmove=e=>{ if(down){ const p=pos(e); paint(p.x,p.y);} };
    const mup=()=>{ down=false; };
    c.addEventListener("mousedown",mdown);
    window.addEventListener("mousemove",mmove);
    window.addEventListener("mouseup",mup);
    return ()=>{ c.removeEventListener("mousedown",mdown); window.removeEventListener("mousemove",mmove); window.removeEventListener("mouseup",mup); };
  },[sim, mode, volts, N]);

  // solve + render loop
  useEffect(()=>{
    const c=cnv.current; if(!c) return;
    const ctx=c.getContext("2d",{alpha:false});
    let raf;
    const loop=()=>{
      sweep(sim, sweeps);
      render(ctx, sim, arrows);
      raf=requestAnimationFrame(loop);
    };
    loop(); return ()=> cancelAnimationFrame(raf);
  },[sim, sweeps, arrows]);

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">Electrostatics — Conductors + Laplace</h2>
      <canvas ref={cnv} style={{width:"100%", imageRendering:"pixelated"}}/>
      <div className="grid" style={{gridTemplateColumns:"1fr 340px", gap:16}}>
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <button className="px-3 py-1 rounded bg-white/10 border border-white/10"
                  onClick={()=>reset(sim)}>Reset</button>
          <div className="mt-2 flex gap-2 text-sm">
            <span>Mode:</span>
            <label><input type="radio" checked={mode==="paint"} onChange={()=>setMode("paint")}/> paint</label>
            <label><input type="radio" checked={mode==="erase"} onChange={()=>setMode("erase")}/> erase</label>
          </div>
        </section>
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <Slider label="paint volts" v={volts} set={setVolts} min={-2} max={2} step={0.05}/>
          <Slider label="grid N" v={N} set={setN} min={96} max={224} step={16}/>
          <Slider label="sweeps/frame" v={sweeps} set={setSweeps} min={5} max={120} step={5}/>
          <Slider label="field arrows" v={arrows} set={setArrows} min={8} max={32} step={1}/>
          <ActiveReflection
            title="Active Reflection — Laplace"
            storageKey="reflect_laplace"
            prompts={[
              "Draw two plates at +1 and −1: do you see near-uniform fields between them?",
              "Paint a round electrode: how do equipotentials bend?",
              "Increase sweeps: edges sharpen where curvature is high."
            ]}
          />
        </section>
      </div>
    </div>
  );
}

function makeSim(N){
  const phi = Array.from({length:N},()=>Array(N).fill(0));
  const mask= Array.from({length:N},()=>Array(N).fill(false));
  // borders grounded
  for(let i=0;i<N;i++){ mask[0][i]=mask[N-1][i]=mask[i][0]=mask[i][N-1]=true; phi[0][i]=phi[N-1][i]=phi[i][0]=phi[i][N-1]=0; }
  return {N, phi, mask};
}
function reset(sim){ const {N,phi,mask}=sim; for(let y=0;y<N;y++) for(let x=0;x<N;x++){ phi[y][x]=0; mask[y][x]=false; } for(let i=0;i<N;i++){ mask[0][i]=mask[N-1][i]=mask[i][0]=mask[i][N-1]=true; } }
function sweep(sim, iters){
  const {N,phi,mask}=sim;
  for(let k=0;k<iters;k++){
    for(let y=1;y<N-1;y++){
      for(let x=1;x<N-1;x++){
        if(mask[y][x]) continue;
        phi[y][x] = 0.25*(phi[y-1][x]+phi[y+1][x]+phi[y][x-1]+phi[y][x+1]);
      }
    }
  }
}
function render(ctx, sim, arrows){
  const {N,phi,mask}=sim;
  const img=ctx.createImageData(N,N);
  let mn=Infinity,mx=-Infinity; for(let y=0;y<N;y++) for(let x=0;x<N;x++){ const v=phi[y][x]; if(v<mn) mn=v; if(v>mx) mx=v; }
  for(let y=0;y<N;y++){
    for(let x=0;x<N;x++){
      const t=(phi[y][x]-mn)/(mx-mn+1e-9);
      const off=4*(y*N+x);
      img.data[off  ]=Math.floor(40+200*t);
      img.data[off+1]=Math.floor(50+180*(1-t));
      img.data[off+2]=Math.floor(220*(1-t));
      img.data[off+3]=255;
      if(mask[y][x]){ img.data[off]=255; img.data[off+1]=255; img.data[off+2]=255; }
    }
  }
  ctx.putImageData(img,0,0);
  // field arrows (E = -∇φ)
  ctx.strokeStyle="#fff"; ctx.lineWidth=1;
  const G=arrows;
  for(let j=0;j<G;j++) for(let i=0;i<G;i++){
    const x=Math.floor((i+0.5)*N/G), y=Math.floor((j+0.5)*N/G);
    const dphidx=(phi[y][Math.min(N-1,x+1)]-phi[y][Math.max(0,x-1)])*0.5;
    const dphidy=(phi[Math.min(N-1,y+1)][x]-phi[Math.max(0,y-1)][x])*0.5;
    const Ex=-dphidx, Ey=-dphidy;
    const s=2.0; const px=x+0.5, py=y+0.5;
    ctx.beginPath(); ctx.moveTo(px,py); ctx.lineTo(px+s*Ex,py+s*Ey); ctx.stroke();
  }
}
function Slider({label,v,set,min,max,step}){ const show=(typeof v==="number"&&v.toFixed)?v.toFixed(2):v;
  return (<div className="mb-2"><label className="text-sm opacity-80">{label}: <b>{show}</b></label>
          <input className="w-full" type="range" min={min} max={max} step={step}
                 value={v} onChange={e=>set(parseFloat(e.target.value))}/></div>);
}
