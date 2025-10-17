import { useMemo, useState } from "react";
import ActiveReflection from "./ActiveReflection.jsx";

/** Build N points in 2 blobs; similarity W_ij = exp(-||xi-xj||^2 / (2σ^2)).
 *  Laplacian L = D - W; take 2nd eigenvector (Fiedler) via power iteration + deflation to split.
 */
function rng(seed){ let s=seed|0||2025; return ()=> (s=(1664525*s+1013904223)>>>0)/2**32; }
function randn(r){ const u=Math.max(r(),1e-12), v=Math.max(r(),1e-12); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); }

export default function SpectralClusteringLab(){
  const [n,setN]=useState(80);
  const [sigma,setSigma]=useState(0.20);
  const [seed,setSeed]=useState(7);
  const [sep,setSep]=useState(2.0);

  const pts = useMemo(()=>{
    const r=rng(seed); const A=[], B=[];
    for(let i=0;i<n/2;i++) A.push([ -sep/2 + 0.6*randn(r), 0.6*randn(r) ]);
    for(let i=0;i<n/2;i++) B.push([  sep/2 + 0.6*randn(r), 0.6*randn(r) ]);
    return A.concat(B);
  },[n,seed,sep]);

  const clusters = useMemo(()=> spectralCluster(pts, sigma), [pts, sigma]);

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">Spectral Clustering — Laplacian & Fiedler vector</h2>
      <Scatter pts={pts} labels={clusters.labels}/>
      <div className="grid" style={{gridTemplateColumns:'1fr 320px', gap:16}}>
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <Slider label="points" v={n} set={setN} min={20} max={300} step={10}/>
          <Slider label="σ (similarity)" v={sigma} set={setSigma} min={0.05} max={0.8} step={0.01}/>
          <Slider label="blob separation" v={sep} set={setSep} min={0.4} max={3.5} step={0.05}/>
          <Slider label="seed" v={seed} set={setSeed} min={1} max={9999} step={1}/>
        </section>
        <ActiveReflection
          title="Active Reflection — Spectral Clustering"
          storageKey="reflect_speccluster"
          prompts={[
            "Lower σ: graph edges become local; does clustering sharpen?",
            "Raise σ: graph becomes dense; when do clusters blur?",
            "What happens as separation shrinks toward 0?"
          ]}
        />
      </div>
    </div>
  );
}

function spectralCluster(X, sigma){
  const n=X.length;
  const W=Array.from({length:n},()=>Array(n).fill(0));
  for(let i=0;i<n;i++){
    for(let j=i+1;j<n;j++){
      const d=(X[i][0]-X[j][0])**2+(X[i][1]-X[j][1])**2;
      const w=Math.exp(-d/(2*sigma*sigma));
      W[i][j]=W[j][i]=w;
    }
  }
  const D = Array(n).fill(0).map((_,i)=> W[i].reduce((a,b)=>a+b,0));
  const L=Array.from({length:n},()=>Array(n).fill(0));
  for(let i=0;i<n;i++){
    for(let j=0;j<n;j++){
      L[i][j] = (i===j? D[i] : 0) - W[i][j];
    }
  }
  // Power iteration for smallest eigenvectors: use shifted inverse-like via Laplacian smoothing heuristic
  // For toy purposes, we find the Fiedler vector by:
  // 1) find trivial eigenvector u0 = [1,...,1] (skip)
  // 2) power on (I - αL) to get next dominant; α small.
  const alpha=1/(Math.max(...D)+1e-9);
  const M = (v)=> { // apply (I - αL) v
    const y=Array(n).fill(0);
    for(let i=0;i<n;i++){
      let Lv = D[i]*v[i];
      for(let j=0;j<n;j++) if(i!==j) Lv -= W[i][j]*v[j];
      y[i] = v[i] - alpha*Lv;
    }
    // orthogonalize to constant vector
    const mean = y.reduce((a,b)=>a+b,0)/n;
    for(let i=0;i<n;i++) y[i]-=mean;
    // normalize
    const norm=Math.sqrt(y.reduce((a,b)=>a+b*b,0))||1;
    return y.map(z=>z/norm);
  };
  let v=Array(n).fill(0).map((_,i)=> (i%2?1:-1));
  for(let k=0;k<120;k++) v = M(v);
  const labels = v.map(x=> x>=0 ? 1 : 0);
  return {labels, v};
}

function Scatter({pts, labels}){
  const W=640,H=360,pad=20;
  const xs=pts.map(p=>p[0]), ys=pts.map(p=>p[1]);
  const minX=Math.min(...xs), maxX=Math.max(...xs);
  const minY=Math.min(...ys), maxY=Math.max(...ys);
  const X=x=> pad + (x-minX)/(maxX-minX+1e-9)*(W-2*pad);
  const Y=y=> H-pad - (y-minY)/(maxY-minY+1e-9)*(H-2*pad);
  return (
    <section className="p-3 rounded-lg bg-white/5 border border-white/10">
      <h3 className="font-semibold mb-2">Points colored by cluster</h3>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
        <rect x="0" y="0" width={W} height={H} fill="none"/>
        {pts.map((p,i)=> <circle key={i} cx={X(p[0])} cy={Y(p[1])} r="3" />)}
        {/* legend */}
        <text x={pad} y={16} fontSize="10">Two clusters via Fiedler vector sign</text>
      </svg>
    </section>
  );
}
function Slider({label,v,set,min,max,step}){
  const show=(typeof v==='number'&&v.toFixed)?v.toFixed(3):v;
  return (<div className="mb-2"><label className="text-sm opacity-80">{label}: <b>{show}</b></label>
    <input className="w-full" type="range" min={min} max={max} step={step} value={v}
      onChange={e=>set(parseFloat(e.target.value))}/></div>);
}
