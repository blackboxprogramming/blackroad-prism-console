import { useMemo, useRef, useEffect, useState } from "react";
import ActiveReflection from "./ActiveReflection.jsx";

function rng(seed){ let s=seed|0||7; return ()=> (s=(1664525*s+1013904223)>>>0)/2**32; }

export default function PowerLloydLab(){
  const [W,H]=[640,360];
  const [n,setN]=useState(10);
  const [seed,setSeed]=useState(7);
  const [iters,setIters]=useState(25);
  const [target,setTarget]=useState(1.0); // target fraction per site (equal)
  const R = useMemo(()=>rng(seed),[seed]);
  const [sites,setSites]=useState(()=> initSites(n, R, W, H));
  const [weights,setWeights]=useState(()=> Array(n).fill(0));

  useEffect(()=>{ setSites(initSites(n, R, W, H)); setWeights(Array(n).fill(0)); },[n,R,W,H]);

  const cnv=useRef(null);
  useEffect(()=>{
    const c=cnv.current; if(!c) return; c.width=W; c.height=H;
    const ctx=c.getContext("2d",{alpha:false});
    let w=weights.slice();
    for(let it=0; it<iters; it++){
      const {areas} = rasterPower(sites, w, W, H);
      // update weights by area error (Newton-ish for power diagrams)
      const tot = areas.reduce((a,b)=>a+b,0)||1;
      const targetPix = target * tot / n;
      for(let i=0;i<n;i++){
        const err = (areas[i]-targetPix)/tot;
        w[i] -= 0.8 * err; // step
      }
    }
    // render final
    const {owner} = rasterPower(sites, w, W, H);
    drawOwner(ctx, owner, sites, W, H);
  },[sites,weights,iters,target,W,H,n]);

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">Power-Lloyd Balancer — target equal areas</h2>
      <canvas ref={cnv} style={{width:"100%", imageRendering:"pixelated"}}/>
      <div className="grid" style={{gridTemplateColumns:"1fr 360px", gap:16}}>
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <button className="px-2 py-1 rounded bg-white/10 border border-white/10" onClick={()=>setSites(initSites(n, R, W, H))}>Randomize sites</button>
          <button className="ml-2 px-2 py-1 rounded bg-white/10 border border-white/10" onClick={()=>setWeights(Array(n).fill(0))}>Reset weights</button>
        </section>
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <Slider label="sites" v={n} set={setN} min={4} max={36} step={1}/>
          <Slider label="iterations" v={iters} set={setIters} min={1} max={100} step={1}/>
          <Slider label="target fraction per site" v={target} set={setTarget} min={0.2} max={2.0} step={0.05}/>
          <Slider label="seed" v={seed} set={setSeed} min={1} max={9999} step={1}/>
          <ActiveReflection
            title="Active Reflection — Power-Lloyd"
            storageKey="reflect_power_lloyd"
            prompts={[
              "After a few iterations, do cell areas equalize?",
              "What patterns appear when n is large (blue-noise feel)?",
              "How sensitive is convergence to the step size (0.8 here)?"
            ]}
          />
        </section>
      </div>
    </div>
  );
}

function initSites(n,R,W,H){
  const s=[]; for(let i=0;i<n;i++){ s.push({x: (0.1+0.8*R())*W, y:(0.1+0.8*R())*H}); }
  return s;
}
function rasterPower(sites, weights, W, H){
  const owner=new Uint16Array(W*H); const areas=Array(sites.length).fill(0);
  for(let y=0;y<H;y++){
    for(let x=0;x<W;x++){
      let best=0, bv=Infinity;
      for(let i=0;i<sites.length;i++){
        const dx=x-sites[i].x, dy=y-sites[i].y;
        const val=dx*dx+dy*dy - (weights[i]||0)*W*H*0.001;
        if(val<bv){ bv=val; best=i; }
      }
      owner[y*W+x]=best; areas[best]++;
    }
  }
  return {owner, areas};
}
function drawOwner(ctx, owner, sites, W, H){
  const img=ctx.createImageData(W,H);
  const colors=sites.map((_,i)=> hsv(i*0.618, 0.6, 0.95));
  for(let y=0;y<H;y++) for(let x=0;x<W;x++){
    const idx=owner[y*W+x]; const c=colors[idx];
    const off=4*(y*W+x); img.data[off]=c[0]; img.data[off+1]=c[1]; img.data[off+2]=c[2]; img.data[off+3]=255;
  }
  ctx.putImageData(img,0,0);
  // sites
  ctx.strokeStyle="#000"; ctx.lineWidth=1;
  for(const p of sites){ ctx.beginPath(); ctx.arc(p.x,p.y,3,0,Math.PI*2); ctx.stroke(); }
}
function hsv(h,s,v){ const a=h*6, k=n=> Math.max(0, Math.min(1, Math.abs((a-n)%6-3)-1));
  const r=v*(1-s*k(5)), g=v*(1-s*k(3)), b=v*(1-s*k(1));
  return [Math.floor(255*r), Math.floor(255*g), Math.floor(255*b)];
}
function Slider({label,v,set,min,max,step}){ const show=(typeof v==='number'&&v.toFixed)?v.toFixed(2):v;
  return (<div className="mb-2"><label className="text-sm opacity-80">{label}: <b>{show}</b></label>
  <input className="w-full" type="range" min={min} max={max} step={step}
    value={v} onChange={e=>set(parseFloat(e.target.value))}/></div>);
}
