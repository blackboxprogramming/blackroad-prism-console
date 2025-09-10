import { useMemo, useState } from "react";

function clamp01(x){ return Math.max(0, Math.min(1, x)); }
function linspace(n){ return Array.from({length:n}, (_,i)=>i/(n-1)); }
function normalize(arr){
  const s = arr.reduce((a,b)=>a+b,0) || 1;
  return arr.map(x=>x/s);
}
function cdf(pdf){
  let s=0; return pdf.map(x=>{ s+=x; return s; });
}
function w1(pdfA, pdfB){
  // W1 in 1D = integral |CDF_A - CDF_B|
  const CA = cdf(pdfA), CB = cdf(pdfB);
  const n = CA.length;
  let area = 0;
  for (let i=1;i<n;i++){
    const dx = 1/(n-1);
    const y0 = Math.abs(CA[i-1]-CB[i-1]);
    const y1 = Math.abs(CA[i]-CB[i]);
    area += 0.5*(y0+y1)*dx; // trapezoid
  }
  return area;
}
function lerp(a,b,t){ return a + (b-a)*t; }

export default function OptimalTransportLab(){
  const [nBins,setNBins] = useState(64);
  const [spreadA,setSpreadA] = useState(0.08);
  const [centerA,setCenterA] = useState(0.30);
  const [spreadB,setSpreadB] = useState(0.08);
  const [centerB,setCenterB] = useState(0.70);
  const [t,setT] = useState(0.5);

  const x = useMemo(()=>linspace(nBins),[nBins]);

  // Make two Gaussians (truncated) then normalize to PDFs
  const pdfA = useMemo(()=>{
    const s2 = spreadA*spreadA + 1e-9;
    const arr = x.map(u=>Math.exp(-(u-centerA)*(u-centerA)/(2*s2)));
    return normalize(arr);
  },[x,centerA,spreadA]);

  const pdfB = useMemo(()=>{
    const s2 = spreadB*spreadB + 1e-9;
    const arr = x.map(u=>Math.exp(-(u-centerB)*(u-centerB)/(2*s2)));
    return normalize(arr);
  },[x,centerB,spreadB]);

  // Monge 1-D interpolation: shift mass along quantiles ⇒ CDF⁻¹( (1−t)·p + t·q ) 
  // Implementation trick: construct a transport map by matching cumulative mass.
  const interp = useMemo(()=>{
    const CA = cdf(pdfA), CB = cdf(pdfB);
    // Build inverse CDFs (quantile functions)
    const invCdf = (C) => (q)=>{
      // binary search over grid to find smallest u with C(u) >= q
      let lo=0, hi=C.length-1;
      while(lo<hi){
        const mid=(lo+hi)>>1;
        if(C[mid] >= q) hi=mid; else lo=mid+1;
      }
      return lo/(C.length-1);
    };
    const QA = invCdf(CA), QB = invCdf(CB);

    // Displacement interpolation in 1-D: x_t(q) = (1−t)*QA(q) + t*QB(q)
    // Then pushforward uniform q ∈ [0,1] through x_t to make a histogram.
    const NB = x.length;
    const counts = new Array(NB).fill(0);
    const samples = 2048;
    for(let i=0;i<samples;i++){
      const q = (i+0.5)/samples;
      const pos = lerp(QA(q), QB(q), t);
      const bin = Math.max(0, Math.min(NB-1, Math.round(pos*(NB-1))));
      counts[bin] += 1;
    }
    return normalize(counts);
  },[pdfA,pdfB,x,t]);

  const dist = useMemo(()=>w1(pdfA, pdfB),[pdfA,pdfB]);

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-semibold">Optimal Transport Lab — 1D Wasserstein-1</h2>
      <p className="opacity-80 text-sm">
        W<sub>1</sub>(A,B) ≈ {dist.toFixed(4)} (area between CDFs). The middle plot is the displacement geodesic PDF at t.
      </p>

      <Controls label="Bins" v={nBins} set={setNBins} min={16} max={256} step={16}/>
      <div className="grid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:16}}>
        <Panel title="Source A">
          <Controls label="Center A" v={centerA} set={setCenterA} min={0.0} max={1.0} step={0.01}/>
          <Controls label="Spread A" v={spreadA} set={setSpreadA} min={0.02} max={0.25} step={0.01}/>
          <BarChart xs={x} ys={pdfA}/>
        </Panel>
        <Panel title="Geodesic at t">
          <Controls label="t" v={t} set={setT} min={0.0} max={1.0} step={0.01}/>
          <BarChart xs={x} ys={interp}/>
        </Panel>
        <Panel title="Target B">
          <Controls label="Center B" v={centerB} set={setCenterB} min={0.0} max={1.0} step={0.01}/>
          <Controls label="Spread B" v={spreadB} set={setSpreadB} min={0.02} max={0.25} step={0.01}/>
          <BarChart xs={x} ys={pdfB}/>
        </Panel>
      </div>
    </div>
  );
}

function Panel({title,children}){
  return (
    <section className="p-3 rounded-lg bg-white/5 border border-white/10">
      <h3 className="font-semibold mb-2">{title}</h3>
      {children}
    </section>
  );
}
function Controls({label,v,set,min,max,step}){
  return (
    <div className="mb-2">
      <label className="text-sm opacity-80">{label}: <b>{typeof v==='number'?v.toFixed(3):v}</b></label>
      <input type="range" className="w-full" min={min} max={max} step={step} value={v}
             onChange={e=>set(parseFloat(e.target.value))}/>
    </div>
  );
}
function BarChart({xs,ys}){
  // Simple SVG columns
  const W=320, H=120, pad=8;
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
      <rect x="0" y="0" width={W} height={H} fill="none" />
      {ys.map((y,i)=>{
        const x = pad + i*( (W-2*pad)/ys.length );
        const w = (W-2*pad)/ys.length * 0.95;
        const h = (H-2*pad)*y;
        return <rect key={i} x={x} y={H-pad-h} width={w} height={h} rx="2" ry="2" />;
      })}
    </svg>
  );
}
