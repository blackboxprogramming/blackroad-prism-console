import { useEffect, useRef, useState } from "react";
import ActiveReflection from "./ActiveReflection.jsx";

const TAU = Math.PI*2;
const MODES = [
  [1,1],[1,2],[2,1],[2,2],[1,3],[3,1],[2,3],[3,2],[3,3],[1,4],[4,1]
];

export default function DrumWaveLab(){
  const [size, setSize] = useState(160);
  const [speed, setSpeed] = useState(1.0);
  const [amplitude, setAmp] = useState(1.0);
  const [sel, setSel] = useState(new Set([0,1,2,3])); // pick some modes
  const [paused, setPaused] = useState(false);

  const cnv = useRef(null);
  const tRef = useRef(0);

  useEffect(()=>{
    const c = cnv.current; if(!c) return; c.width=size; c.height=size;
    const ctx = c.getContext("2d",{alpha:false});
    let raf;
    const loop = ()=>{
      if(!paused) tRef.current += 0.016*speed;
      draw(ctx, size, tRef.current, sel, amplitude);
      raf = requestAnimationFrame(loop);
    };
    loop(); return ()=> cancelAnimationFrame(raf);
  },[size, speed, amplitude, sel, paused]);

  const toggle = (i)=>{
    setSel(s => { const t=new Set(s); if(t.has(i)) t.delete(i); else t.add(i); return t; });
  };

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">Wave Equation on a Drum — Spectral Modes</h2>
      <canvas ref={cnv} style={{width:"100%", imageRendering:"pixelated"}}/>
      <div className="grid" style={{gridTemplateColumns:'1fr 320px', gap:16}}>
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <button onClick={()=>setPaused(p=>!p)} className="px-3 py-1 rounded bg-white/10 border border-white/10">
            {paused? "Play":"Pause"}
          </button>
          <Slider label="canvas size" v={size} set={setSize} min={120} max={300} step={20}/>
          <Slider label="speed" v={speed} set={setSpeed} min={0.1} max={3.0} step={0.05}/>
          <Slider label="amplitude" v={amplitude} set={setAmp} min={0.2} max={2.0} step={0.05}/>
          <div className="mt-3 text-sm">
            <p className="font-semibold mb-1">Modes (m,n)</p>
            <div className="grid" style={{gridTemplateColumns:'repeat(4, minmax(0,1fr))', gap:6}}>
              {MODES.map(([m,n],i)=>(
                <label key={i} className="flex items-center gap-1">
                  <input type="checkbox" checked={sel.has(i)} onChange={()=>toggle(i)}/>
                  <span>{m},{n}</span>
                </label>
              ))}
            </div>
          </div>
        </section>
        <ActiveReflection
          title="Active Reflection — Drum"
          storageKey="reflect_drum"
          prompts={[
            "Which low modes dominate the shape and which add fine ripples?",
            "Pick symmetric pairs (m,n) and (n,m): do you see rotated symmetry?",
            "Increase speed: does temporal frequency match √(m²+n²)?"
          ]}
        />
      </div>
    </div>
  );
}

function draw(ctx, N, t, sel, A){
  const img = ctx.createImageData(N,N);
  const picks = [...sel].map(i=>MODES[i]);
  // precompute sines along x/y for efficiency
  const sx = picks.map(([m,_]) => Array.from({length:N}, (_,i)=> Math.sin(Math.PI*m*(i+0.5)/N)));
  const sy = picks.map(([_,n]) => Array.from({length:N}, (_,j)=> Math.sin(Math.PI*n*(j+0.5)/N)));
  const w  = picks.map(([m,n]) => Math.PI*Math.hypot(m,n));
  // normalize
  const norm = Math.max(1, picks.length);
  for(let y=0;y<N;y++){
    for(let x=0;x<N;x++){
      let u=0;
      for(let k=0;k<picks.length;k++){
        u += (A/norm) * sx[k][x]*sy[k][y]*Math.cos(w[k]*t);
      }
      // map to pastel palette
      const tcol = 0.5 + 0.5*Math.tanh(2*u);
      const R = Math.floor(40 + 200*tcol);
      const G = Math.floor(60 + 160*(1-tcol));
      const B = Math.floor(220*(1-tcol));
      const off = 4*(y*N+x);
      img.data[off]=R; img.data[off+1]=G; img.data[off+2]=B; img.data[off+3]=255;
    }
  }
  ctx.putImageData(img,0,0);
}
function Slider({label,v,set,min,max,step}){
  const show=(typeof v==='number'&&v.toFixed)?v.toFixed(3):v;
  return (<div className="mb-2"><label className="text-sm opacity-80">{label}: <b>{show}</b></label>
    <input className="w-full" type="range" min={min} max={max} step={step}
      value={v} onChange={e=>set(parseFloat(e.target.value))}/></div>);
}
