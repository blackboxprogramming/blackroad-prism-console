import { useMemo, useState } from "react";
import ActiveReflection from "./ActiveReflection.jsx";
import OTMapViewer from "../components/OTMapViewer.jsx";

function rng(seed){ let s=seed>>>0||1; return ()=> (s=(1664525*s+1013904223)>>>0)/2**32; }

export default function OTLab(){
  const width = 160;
  const height = 160;
  const density = useMemo(()=> buildDensity(width,height), [width,height]);
  const [mode,setMode] = useState('semidiscrete');
  const [siteCount,setSiteCount] = useState(8);
  const [iterations,setIterations] = useState(48);
  const [seed,setSeed] = useState(7);
  const [frameIndex,setFrameIndex] = useState(0);

  const sites = useMemo(()=> initSites(siteCount, rng(seed), width, height), [siteCount, seed, width, height]);
  const semi = useMemo(()=> computeSemiDiscrete(density, sites, iterations), [density, sites, iterations]);
  const dynamic = useMemo(()=> computeDynamicDemo(width, height, 12), [width, height]);

  const targetMass = 1/siteCount;

  return (
    <div className="p-4 space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Optimal Transport Lab</h2>
          <p className="text-sm opacity-80">Semi-discrete weight balancing and Benamou–Brenier inspired flow playback.</p>
        </div>
        <div className="flex gap-2">
          <button
            className={`px-3 py-1 rounded border ${mode==='semidiscrete'?'bg-white/20 border-white/40':'bg-white/5 border-white/10'}`}
            onClick={()=>setMode('semidiscrete')}
          >Semi-discrete</button>
          <button
            className={`px-3 py-1 rounded border ${mode==='dynamic'?'bg-white/20 border-white/40':'bg-white/5 border-white/10'}`}
            onClick={()=>setMode('dynamic')}
          >Dynamic</button>
        </div>
      </header>
      <section className="grid" style={{gridTemplateColumns:"1fr 320px", gap:16}}>
        <div className="space-y-3">
          <OTMapViewer
            mode={mode}
            owner={mode==='semidiscrete'?semi.owner:undefined}
            densityFrame={mode==='dynamic'?dynamic.frames[frameIndex]:undefined}
            width={width}
            height={height}
            sites={sites}
            frameIndex={frameIndex}
          />
          {mode==='semidiscrete' && (
            <table className="w-full text-xs border-collapse border border-white/10">
              <thead>
                <tr className="bg-white/5">
                  <th className="border border-white/10 px-2 py-1 text-left">Site</th>
                  <th className="border border-white/10 px-2 py-1 text-left">Mass</th>
                  <th className="border border-white/10 px-2 py-1 text-left">Error</th>
                </tr>
              </thead>
              <tbody>
                {semi.masses.map((m,i)=>{
                  const rel = Math.abs(m - targetMass)/targetMass;
                  return (
                    <tr key={i} className="odd:bg-white/5">
                      <td className="border border-white/10 px-2 py-1">{i+1}</td>
                      <td className="border border-white/10 px-2 py-1">{m.toFixed(3)}</td>
                      <td className="border border-white/10 px-2 py-1">{(rel*100).toFixed(2)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          {mode==='dynamic' && (
            <div className="text-sm space-y-1">
              <div>Frame {frameIndex+1} / {dynamic.frames.length}</div>
              <div>Continuity proxy residual: <b>{dynamic.residual.toExponential(2)}</b></div>
            </div>
          )}
        </div>
        <div className="space-y-3 p-3 rounded-lg bg-white/5 border border-white/10">
          {mode==='semidiscrete' ? (
            <>
              <Slider label="sites" v={siteCount} set={setSiteCount} min={3} max={18} step={1} />
              <Slider label="iterations" v={iterations} set={setIterations} min={8} max={120} step={1} />
              <Slider label="seed" v={seed} set={setSeed} min={1} max={9999} step={1} />
            </>
          ) : (
            <Slider label="frame" v={frameIndex} set={(v)=>setFrameIndex(Math.round(v))} min={0} max={dynamic.frames.length-1} step={1} />
          )}
          <ActiveReflection
            title="Active Reflection — Optimal Transport"
            storageKey="reflect_ot_lab"
            prompts={mode==='semidiscrete'
              ? [
                "Do cell masses equalize as iterations increase?",
                "How does the seed influence convergence speed?",
                "Where do site clusters create high-error cells?"
              ]
              : [
                "How does the density morph as you scrub through frames?",
                "Where does mass accelerate vs. slow down?",
                "What additional diagnostics would help tune the solver?"
              ]}
          />
        </div>
      </section>
    </div>
  );
}

function buildDensity(width,height){
  const data = new Float64Array(width*height);
  const bumps = [
    { x: 0.32*width, y: 0.65*height, s: width*0.18 },
    { x: 0.72*width, y: 0.35*height, s: width*0.22 }
  ];
  let sum=0;
  for(let y=0;y<height;y++){
    for(let x=0;x<width;x++){
      let v=0;
      for(const b of bumps){
        const dx=(x-b.x)/b.s;
        const dy=(y-b.y)/b.s;
        v += Math.exp(-0.5*(dx*dx+dy*dy));
      }
      data[y*width+x]=v;
      sum+=v;
    }
  }
  for(let i=0;i<data.length;i++) data[i]/=sum;
  return { width, height, data, total:1 };
}

function initSites(n, R, width, height){
  const arr=[];
  for(let i=0;i<n;i++){
    arr.push({ x:(0.2+0.6*R())*width, y:(0.2+0.6*R())*height });
  }
  return arr;
}

function computeSemiDiscrete(density, sites, iterations){
  if(sites.length===0) return { owner:new Uint16Array(density.width*density.height), masses:[], weights:[] };
  const weights = new Array(sites.length).fill(0);
  const target = sites.map(()=> 1/sites.length);
  let owner = new Uint16Array(density.width*density.height);
  let masses = target.slice();
  const step0 = 0.8;
  for(let it=0; it<iterations; it++){
    const { owner:own, masses:mass } = rasterize(sites, weights, density);
    owner = own;
    masses = mass;
    for(let i=0;i<weights.length;i++){
      const err = masses[i] - target[i];
      weights[i] -= step0 * err;
    }
  }
  return { owner, masses, weights };
}

function rasterize(sites, weights, density){
  const { width, height, data } = density;
  const owner = new Uint16Array(width*height);
  const masses = new Array(sites.length).fill(0);
  for(let y=0;y<height;y++){
    for(let x=0;x<width;x++){
      let best=0,bv=Infinity;
      for(let i=0;i<sites.length;i++){
        const dx=x-sites[i].x;
        const dy=y-sites[i].y;
        const val = dx*dx+dy*dy - weights[i];
        if(val<bv){ bv=val; best=i; }
      }
      const idx=y*width+x;
      owner[idx]=best;
      masses[best]+=data[idx];
    }
  }
  return { owner, masses };
}

function computeDynamicDemo(width,height,steps){
  const frames=[];
  const bumpA={ x:0.25*width, y:0.6*height, s:width*0.2 };
  const bumpB={ x:0.75*width, y:0.4*height, s:width*0.2 };
  for(let k=0;k<=steps;k++){
    const t=k/steps;
    const frame={ width,height,data:new Float64Array(width*height) };
    let sum=0;
    for(let y=0;y<height;y++){
      for(let x=0;x<width;x++){
        const mix = mixBumps(x,y,bumpA,bumpB,t);
        frame.data[y*width+x]=mix;
        sum+=mix;
      }
    }
    for(let i=0;i<frame.data.length;i++) frame.data[i]/=sum;
    frames.push(frame);
  }
  let residual=0;
  for(let k=0;k<steps;k++){
    for(let i=0;i<frames[k].data.length;i++){
      const diff = frames[k+1].data[i]-frames[k].data[i];
      residual = Math.max(residual, Math.abs(diff));
    }
  }
  return { frames, residual };
}

function mixBumps(x,y,a,b,t){
  const ga = gaussian(x,y,a.x,a.y,a.s);
  const gb = gaussian(x,y,b.x,b.y,b.s);
  return (1-t)*ga + t*gb;
}

function gaussian(x,y,cx,cy,s){
  const dx=(x-cx)/s;
  const dy=(y-cy)/s;
  return Math.exp(-0.5*(dx*dx+dy*dy));
}

function Slider({label,v,set,min,max,step}){
  const show = typeof v==='number' && v.toFixed ? v.toFixed(2) : v;
  return (
    <div>
      <label className="text-sm opacity-80 block">{label}: <b>{show}</b></label>
      <input className="w-full" type="range" min={min} max={max} step={step} value={v}
        onChange={e=>set(parseFloat(e.target.value))} />
    </div>
  );
}
