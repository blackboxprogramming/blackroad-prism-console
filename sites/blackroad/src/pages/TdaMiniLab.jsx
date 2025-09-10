import { useMemo, useState } from "react";

/**
 * 1-D Persistent Homology (H0) intuition:
 *  - Points on [0,1]; grow radius r; intervals [x_i - r, x_i + r] merge.
 *  - Each point "born" at r=0; a component "dies" when its interval meets the next (at r = gap/2).
 *  - We draw a barcode and the component count vs r.
 */
function rng(seed){ let s=seed|0||1234567; return ()=> (s = (1664525*s+1013904223)>>>0)/2**32; }

function samplePoints(n, seed){
  const r = rng(seed);
  const xs = Array.from({length:n},()=>r()).sort((a,b)=>a-b);
  return xs;
}

function computeDeaths(xs){
  // deaths for components = half the gaps between consecutive sorted points
  const deaths = xs.map(_=>Infinity);
  for(let i=0;i<xs.length-1;i++){
    const gap = xs[i+1]-xs[i];
    const d = gap/2;
    // in H0 barcode, right component dies at half-gap; left persists until next left merge
    deaths[i+1] = Math.min(deaths[i+1], d);
  }
  // The leftmost survives until max radius (∞ here). We'll clamp in plot.
  return deaths;
}

export default function TdaMiniLab(){
  const [n,setN] = useState(12);
  const [seed,setSeed] = useState(2025);
  const [rMax,setRMax] = useState(0.20);

  const pts = useMemo(()=>samplePoints(n, seed),[n,seed]);
  const deaths = useMemo(()=>computeDeaths(pts),[pts]);

  // component count vs r
  const compCurve = useMemo(()=>{
    const K=200;
    const rs = Array.from({length:K},(_,i)=> i*(rMax/(K-1)));
    const counts = rs.map(r=>{
      // intervals overlap if gap <= 2r; components = #clusters after merging
      let c = pts.length;
      for(let i=0;i<pts.length-1;i++){
        if(pts[i+1]-pts[i] <= 2*r) c--;
      }
      return c;
    });
    return {rs, counts};
  },[pts, rMax]);

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-semibold">Topological Mini-Lab — 1D Barcodes (H₀)</h2>
      <Controls label="points" v={n} set={setN} min={4} max={40} step={1}/>
      <Controls label="r max" v={rMax} set={setRMax} min={0.05} max={0.4} step={0.005}/>
      <Controls label="seed" v={seed} set={setSeed} min={1} max={9999} step={1}/>

      <PointLine pts={pts}/>
      <Barcode pts={pts} deaths={deaths} rMax={rMax}/>
      <CompPlot rs={compCurve.rs} counts={compCurve.counts} rMax={rMax}/>
      <p className="text-sm opacity-80">
        Intuition: as radius grows, nearby points merge into clusters; bars end when clusters meet (death = half-gap).
      </p>
    </div>
  );
}

function Controls({label,v,set,min,max,step}){
  const show = typeof v==='number' && v.toFixed ? v.toFixed(3) : v;
  return (
    <div className="mb-1">
      <label className="text-sm opacity-80">{label}: <b>{show}</b></label>
      <input className="w-full" type="range" min={min} max={max} step={step}
             value={v} onChange={e=>set(parseFloat(e.target.value))}/>
    </div>
  );
}

function PointLine({pts}){
  const W=640, H=60, pad=10;
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
      <line x1={pad} y1={H/2} x2={W-pad} y2={H/2} strokeWidth="2"/>
      {pts.map((x,i)=>{
        const X = pad + x*(W-2*pad);
        return <circle key={i} cx={X} cy={H/2} r="4"/>;
      })}
      <text x={pad} y={14} fontSize="10">points on [0,1]</text>
    </svg>
  );
}

function Barcode({pts, deaths, rMax}){
  // Each bar: start at r=0, end at min(death, rMax)
  const W=640, H=Math.max(80, 14*pts.length), pad=10;
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
      <text x={pad} y={12} fontSize="10">H₀ barcode (birth=0, death=½·gap)</text>
      {pts.map((x,i)=>{
        const y = 24 + i*12;
        const x0 = pad;
        const x1 = pad + (Math.min(deaths[i], rMax)/rMax)*(W-2*pad);
        return <line key={i} x1={x0} y1={y} x2={x1} y2={y} strokeWidth="6"/>;
      })}
      <line x1={pad} y1={H-12} x2={W-pad} y2={H-12} strokeDasharray="4 4"/>
      <text x={W-70} y={H-16} fontSize="10">r = r_max</text>
    </svg>
  );
}

function CompPlot({rs, counts, rMax}){
  const W=640, H=160, pad=24;
  const maxC = Math.max(...counts);
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
      <text x={pad} y={12} fontSize="10">#components vs radius</text>
      {rs.map((r,i)=>{
        const x = pad + (r/rMax)*(W-2*pad);
        const y = H-pad - (counts[i]/maxC)*(H-2*pad);
        const x2 = i? pad + (rs[i-1]/rMax)*(W-2*pad) : x;
        const y2 = i? H-pad - (counts[i-1]/maxC)*(H-2*pad) : y;
        return <line key={i} x1={x2} y1={y2} x2={x} y2={y} strokeWidth="2"/>;
      })}
      {/* axes */}
      <line x1={pad} y1={H-pad} x2={W-pad} y2={H-pad} />
      <line x1={pad} y1={H-pad} x2={pad} y2={pad} />
      <text x={W-60} y={H-6} fontSize="10">r</text>
      <text x={pad-14} y={pad} fontSize="10">#</text>
    </svg>
  );
}

