import { useMemo, useState } from "react";

/** -------- utilities -------- */
function rng(seed){ // tiny LCG for repeatability
  let s = seed|0 || 123456789;
  return ()=> (s = (1103515245*s + 12345) >>> 0) / 2**32;
}
function randn(r){ // Box–Muller
  const u = Math.max(r(), 1e-12), v = Math.max(r(), 1e-12);
  return Math.sqrt(-2*Math.log(u)) * Math.cos(2*Math.PI*v);
}

/** Generate an N×N GOE (real symmetric) matrix with entries ~ N(0,1/N) */
function sampleGOE(N, r) {
  const A = Array.from({length:N}, ()=>Array(N).fill(0));
  const scale = 1/Math.sqrt(N);
  for(let i=0;i<N;i++){
    for(let j=i;j<N;j++){
      const val = randn(r)*scale;
      A[i][j] = A[j][i] = (i===j? randn(r)*scale : val);
    }
  }
  return A;
}

/** Jacobi eigenvalue algorithm (symmetric) — slow but OK for N≤48 */
function jacobiEigenvalues(A, tol=1e-10, maxIter=5000){
  const N = A.length;
  const a = A.map(row=>row.slice());
  for(let iter=0; iter<maxIter; iter++){
    // find largest off-diagonal
    let p=0,q=1, max=0;
    for(let i=0;i<N;i++) for(let j=i+1;j<N;j++){
      const v = Math.abs(a[i][j]);
      if(v>max){ max=v; p=i; q=j; }
    }
    if(max < tol) break;
    // compute rotation
    const app=a[p][p], aqq=a[q][q], apq=a[p][q];
    const phi = 0.5*Math.atan2(2*apq, (aqq-app));
    const c=Math.cos(phi), s=Math.sin(phi);
    // apply rotation
    for(let k=0;k<N;k++){
      if(k!==p && k!==q){
        const aik=a[k][p], aiq=a[k][q];
        a[k][p]=a[p][k]=c*aik - s*aiq;
        a[k][q]=a[q][k]=s*aik + c*aiq;
      }
    }
    const app2 = c*c*app - 2*s*c*apq + s*s*aqq;
    const aqq2 = s*s*app + 2*s*c*apq + c*c*aqq;
    a[p][p]=app2; a[q][q]=aqq2; a[p][q]=a[q][p]=0;
  }
  return a.map((row,i)=>row[i]).sort((x,y)=>x-y);
}

/** spacing histogram (unfold by dividing by mean spacing per spectrum) */
function spacingStats(eigs, bins=40, sMax=3.5){
  const sp = [];
  for(const es of eigs){
    const diffs = [];
    for(let i=1;i<es.length;i++) diffs.push(es[i]-es[i-1]);
    const mean = diffs.reduce((a,b)=>a+b,0)/Math.max(1,diffs.length);
    for(const d of diffs) if(mean>0) sp.push(d/mean);
  }
  // histogram
  const h = Array(bins).fill(0);
  for(const s of sp){
    if(s>=0 && s<=sMax){
      const k = Math.min(bins-1, Math.floor((s/sMax)*bins));
      h[k] += 1;
    }
  }
  const total = h.reduce((a,b)=>a+b,0) || 1;
  return {sp, bins: h.map(x=>x/total), sMax};
}

/** Wigner surmise (GOE): p(s) = (π/2) s exp(-π s^2 / 4) */
function wignerGOE(s){ return (Math.PI/2)*s*Math.exp(-(Math.PI/4)*s*s); }

/** -------- main component -------- */
export default function RandomMatrixLab(){
  const [N,setN]=useState(36);
  const [samples,setSamples]=useState(28);
  const [seed,setSeed]=useState(42);
  const [bins,setBins]=useState(40);
  const [sMax,setSMax]=useState(3.5);

  const {hist, curve} = useMemo(()=>{
    const r = rng(seed);
    const eigs = [];
    for(let m=0;m<samples;m++){
      const A = sampleGOE(N, r);
      eigs.push(jacobiEigenvalues(A));
    }
    const {bins:bh, sMax:mx} = spacingStats(eigs, bins, sMax);
    // make wigner curve
    const xs = Array.from({length:400},(_,i)=> i*(mx/399));
    const ws = xs.map(wignerGOE);
    // normalize curve to match histogram area over [0,mx]
    const dx = xs[1]-xs[0];
    const area = ws.reduce((a,b)=>a+b*dx,0);
    const wsN = ws.map(v=>v/area);
    return {
      hist: {bh, mx},
      curve: {xs, ys: wsN}
    };
  },[N,samples,seed,bins,sMax]);

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">Random-Matrix Spectral Lab — GOE spacings vs Wigner</h2>
      <Controls label="Matrix size N" v={N} set={setN} min={16} max={48} step={1}/>
      <Controls label="Samples" v={samples} set={setSamples} min={10} max={60} step={1}/>
      <Controls label="Bins" v={bins} set={setBins} min={20} max={80} step={1}/>
      <Controls label="s max" v={sMax} set={setSMax} min={2.0} max={5.0} step={0.1}/>
      <Controls label="Seed" v={seed} set={setSeed} min={1} max={9999} step={1}/>
      <SpectralPlot hist={hist} curve={curve}/>
      <p className="text-sm opacity-80">Expected: histogram ≈ Wigner surmise (level repulsion near s→0, exponential tail).</p>
    </div>
  );
}

function Controls({label,v,set,min,max,step}){
  return (
    <div className="mb-1">
      <label className="text-sm opacity-80">{label}: <b>{typeof v==='number'?v.toFixed? v.toFixed(2): v : v}</b></label>
      <input className="w-full" type="range" min={min} max={max} step={step}
             value={v} onChange={e=>set(parseFloat(e.target.value))}/>
    </div>
  );
}

function SpectralPlot({hist, curve}){
  const W=620, H=300, pad=10;
  const bars = hist.bh.length;
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
      <rect x="0" y="0" width={W} height={H} fill="none" />
      {/* histogram */}
      {hist.bh.map((v,i)=>{
        const x = pad + i*((W-2*pad)/bars);
        const w = (W-2*pad)/bars * 0.95;
        const h = (H-2*pad)*v;
        return <rect key={i} x={x} y={H-pad-h} width={w} height={h} rx="2" ry="2" />;
      })}
      {/* Wigner curve */}
      {curve.xs.map((s,i)=>{
        const x = pad + (s/hist.mx)*(W-2*pad);
        const y = (H-2*pad)* (1- curve.ys[i]/Math.max(...curve.ys)) + pad;
        const x2 = i? pad + (curve.xs[i-1]/hist.mx)*(W-2*pad) : x;
        const y2 = i? (H-2*pad)*(1- curve.ys[i-1]/Math.max(...curve.ys)) + pad : y;
        return <line key={i} x1={x2} y1={y2} x2={x} y2={y} strokeWidth="2"/>;
      })}
    </svg>
  );
}

