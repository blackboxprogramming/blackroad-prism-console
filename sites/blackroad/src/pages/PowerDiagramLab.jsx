import { useMemo, useRef, useState, useEffect } from "react";
import ActiveReflection from "./ActiveReflection.jsx";

function rng(seed){ let s=seed|0||2025; return ()=> (s=(1664525*s+1013904223)>>>0)/2**32; }

export default function PowerDiagramLab(){
  const [W,H]=[640,360];
  const [n,setN]=useState(10);
  const [seed,setSeed]=useState(7);
  const [weights,setWeights]=useState(Array(10).fill(0));
  const [spread,setSpread]=useState(0.8);
  const [jitter,setJitter]=useState(0.02);

  const {pts, baseW} = useMemo(()=>initSites(n,seed,spread),[n,seed,spread]);
  useEffect(()=>{ setWeights(Array(n).fill(0)); },[n]);

  const cnv=useRef(null);
  useEffect(()=>{
    const c=cnv.current; if(!c) return; c.width=W; c.height=H;
    const ctx=c.getContext("2d",{alpha:false});
    render(ctx, W, H, pts, weights);
  },[pts, weights]);

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">Power Diagram — weighted Voronoi</h2>
      <canvas ref={cnv} style={{width:"100%", imageRendering:"pixelated"}}/>
      <div className="grid" style={{gridTemplateColumns:"1fr 340px", gap:16}}>
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <Slider label="sites" v={n} set={setN} min={3} max={40} step={1}/>
          <Slider label="spread" v={spread} set={setSpread} min={0.3} max={1.0} step={0.01}/>
          <Slider label="seed" v={seed} set={setSeed} min={1} max={9999} step={1}/>
          <p className="text-sm mt-2">Weights (drag):</p>
          {Array.from({length:n},(_,i)=>(
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs opacity-70 w-6">#{i}</span>
              <input type="range" min={-0.2} max={0.2} step={0.005}
                value={weights[i] ?? 0}
                onChange={e=>{
                  const w=weights.slice(); w[i]=parseFloat(e.target.value);
                  setWeights(w);
                }} className="w-full"/>
            </div>
          ))}
          <p className="text-xs opacity-70 mt-2">Weight enters as −w in power distance (larger weight ⇒ larger cell).</p>
        </section>
        <ActiveReflection
          title="Active Reflection — Power Diagram"
          storageKey="reflect_power"
          prompts={[
            "Increase a site’s weight: does its cell expand linearly or nonlinearly?",
            "What happens when two weights equalize—straight boundaries?",
            "Try many sites: do cells equilibrate toward similar areas?"
          ]}
        />
      </div>
    </div>
  );
}

function initSites(n,seed,spread){
  const r=rng(seed);
  const pts=[];
  for(let i=0;i<n;i++){
    const x=0.5 + spread*(r()-0.5);
    const y=0.5 + spread*(r()-0.5);
    pts.push([x,y]);
  }
  return {pts, baseW:Array(n).fill(0)};
}
function render(ctx, W, H, pts, weights){
  const img=ctx.createImageData(W,H);
  const cols=pts.map((_,i)=> color(i));
  for(let y=0;y<H;y++){
    for(let x=0;x<W;x++){
      const X=(x+0.5)/W, Y=(y+0.5)/H;
      let best=0, bv=Infinity;
      for(let i=0;i<pts.length;i++){
        const dx=X-pts[i][0], dy=Y-pts[i][1];
        const p = dx*dx + dy*dy - (weights[i]||0);
        if(p<bv){ bv=p; best=i; }
      }
      const off=4*(y*W+x);
      const c=cols[best];
      img.data[off]=c[0]; img.data[off+1]=c[1]; img.data[off+2]=c[2]; img.data[off+3]=255;
    }
  }
  ctx.putImageData(img,0,0);
  // draw sites
  ctx.beginPath();
  for(let i=0;i<pts.length;i++){
    const x=pts[i][0]*W, y=pts[i][1]*H;
    ctx.moveTo(x+2,y); ctx.arc(x,y,2,0,Math.PI*2);
  }
  ctx.strokeStyle="#000"; ctx.stroke();
}
function color(i){
  const h=(i*0.618033)%1, s=0.6, v=0.95;
  const a=h*6, k=(n)=>Math.max(0, Math.min(1, Math.abs((a-n)%6-3)-1));
  const r=v*(1 - s*k(5)), g=v*(1 - s*k(3)), b=v*(1 - s*k(1));
  return [Math.floor(255*r),Math.floor(255*g),Math.floor(255*b)];
}
function Slider({label,v,set,min,max,step}){
  const show=(typeof v==='number'&&v.toFixed)?v.toFixed(3):v;
  return (<div className="mb-2"><label className="text-sm opacity-80">{label}: <b>{show}</b></label>
    <input className="w-full" type="range" min={min} max={max} step={step}
      value={v} onChange={e=>set(parseFloat(e.target.value))}/></div>);
}

