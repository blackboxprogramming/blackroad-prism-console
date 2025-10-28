import { useMemo, useState } from 'react';
import ActiveReflection from './ActiveReflection.jsx';

function rng(seed) {
  let s = seed | 0 || 2025;
  return () => (s = (1664525 * s + 1013904223) >>> 0) / 2 ** 32;
}
function randn(r) {
  const u = Math.max(r(), 1e-12),
    v = Math.max(r(), 1e-12);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function twoMoons(n, seed) {
  const r = rng(seed),
    X = [];
  for (let i = 0; i < n; i++) {
    const t = Math.PI * r();
    X.push([Math.cos(t) + 0.1 * randn(r), Math.sin(t) + 0.1 * randn(r)]);
  }
  for (let i = 0; i < n; i++) {
    const t = Math.PI * r();
    X.push([
      1 - Math.cos(t) + 0.1 * randn(r),
      -Math.sin(t) - 0.5 + 0.1 * randn(r),
    ]);
  }
  return X;
}
function circles(n, seed) {
  const r = rng(seed),
    X = [];
  for (let i = 0; i < n; i++) {
    const t = 2 * Math.PI * r();
    X.push([Math.cos(t) + 0.05 * randn(r), Math.sin(t) + 0.05 * randn(r)]);
  }
  for (let i = 0; i < n; i++) {
    const t = 2 * Math.PI * r();
    X.push([0.5 * Math.cos(t), 0.5 * Math.sin(t)]);
  }
  return X;
}
function rbfKernel(X, sigma) {
  const n = X.length;
  const K = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      const dx = X[i][0] - X[j][0],
        dy = X[i][1] - X[j][1];
      K[i][j] = Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma));
    }
  // center: Kc = K - 1K/n - K1/n + 11K11 / n^2
  const row = Array(n).fill(0);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) row[i] += K[i][j];
  const col = row.slice();
  const tot = row.reduce((a, b) => a + b, 0);
  const Kc = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++)
      Kc[i][j] = K[i][j] - row[i] / n - col[j] / n + tot / (n * n);
  return Kc;
}
function topEigen(K, k) {
  const n = K.length;
  const mult = (v) => {
    const y = Array(n).fill(0);
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) y[i] += K[i][j] * v[j];
    return y;
  };
  const vecs = [],
    vals = [];
  for (let m = 0; m < k; m++) {
    let v = Array(n)
      .fill(0)
      .map(() => Math.random() * 2 - 1);
    const gs = (u) => {
      for (const q of vecs) {
        const dot = u.reduce((s, x, i) => s + x * q[i], 0);
        for (let i = 0; i < n; i++) u[i] -= dot * q[i];
      }
      const norm = Math.sqrt(u.reduce((s, x) => s + x * x, 0)) || 1;
      return u.map((x) => x / norm);
    };
    for (let t = 0; t < 200; t++) {
      v = gs(mult(v));
    }
    const Kv = mult(v);
    const lam = v.reduce((s, x, i) => s + x * Kv[i], 0);
    vecs.push(v);
    vals.push(lam);
  }
  return { vecs, vals };
}

export default function KernelPCALab() {
  const [shape, setShape] = useState('moons');
  const [n, setN] = useState(200);
  const [sigma, setSigma] = useState(0.3);
  const [seed, setSeed] = useState(7);

  const X = useMemo(
    () => (shape === 'moons' ? twoMoons(n, seed) : circles(n, seed)),
    [shape, n, seed]
  );
  const K = useMemo(() => rbfKernel(X, sigma), [X, sigma]);
  const { vecs, vals } = useMemo(() => topEigen(K, 3), [K]);

  const Y = useMemo(() => {
    if (vecs.length < 2) return [];
    // project: y_i = [ sqrt(λ1) v1_i, sqrt(λ2) v2_i ]
    const s1 = Math.sqrt(Math.max(1e-12, vals[0])),
      s2 = Math.sqrt(Math.max(1e-12, vals[1]));
    return X.map((_, i) => [s1 * vecs[0][i], s2 * vecs[1][i]]);
  }, [vecs, vals, X]);
import { useMemo, useState } from "react";
import ActiveReflection from "./ActiveReflection.jsx";

function rng(seed){ let s=seed|0||2025; return ()=> (s=(1664525*s+1013904223)>>>0)/2**32; }
function randn(r){ const u=Math.max(r(),1e-12), v=Math.max(r(),1e-12); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); }

function twoMoons(n, seed){
  const r=rng(seed), X=[];
  for(let i=0;i<n;i++){ const t=Math.PI*r(); X.push([Math.cos(t)+0.1*randn(r), Math.sin(t)+0.1*randn(r)]); }
  for(let i=0;i<n;i++){ const t=Math.PI*r(); X.push([1-Math.cos(t)+0.1*randn(r), -Math.sin(t)-0.5+0.1*randn(r)]); }
  return X;
}
function circles(n, seed){
  const r=rng(seed), X=[];
  for(let i=0;i<n;i++){ const t=2*Math.PI*r(); X.push([Math.cos(t)+0.05*randn(r), Math.sin(t)+0.05*randn(r)]); }
  for(let i=0;i<n;i++){ const t=2*Math.PI*r(); X.push([0.5*Math.cos(t), 0.5*Math.sin(t)]); }
  return X;
}
function rbfKernel(X, sigma){
  const n=X.length; const K=Array.from({length:n},()=>Array(n).fill(0));
  for(let i=0;i<n;i++) for(let j=0;j<n;j++){
    const dx=X[i][0]-X[j][0], dy=X[i][1]-X[j][1]; K[i][j]=Math.exp(-(dx*dx+dy*dy)/(2*sigma*sigma));
  }
  // center: Kc = K - 1K/n - K1/n + 11K11 / n^2
  const row=Array(n).fill(0); for(let i=0;i<n;i++) for(let j=0;j<n;j++) row[i]+=K[i][j];
  const col=row.slice(); const tot=row.reduce((a,b)=>a+b,0);
  const Kc=Array.from({length:n},()=>Array(n).fill(0));
  for(let i=0;i<n;i++) for(let j=0;j<n;j++) Kc[i][j]=K[i][j] - row[i]/n - col[j]/n + tot/(n*n);
  return Kc;
}
function topEigen(K, k){
  const n=K.length;
  const mult=(v)=>{ const y=Array(n).fill(0); for(let i=0;i<n;i++) for(let j=0;j<n;j++) y[i]+=K[i][j]*v[j]; return y; };
  const vecs=[], vals=[];
  for(let m=0;m<k;m++){
    let v=Array(n).fill(0).map(()=>Math.random()*2-1);
    const gs=(u)=>{ for(const q of vecs){ const dot=u.reduce((s,x,i)=>s+x*q[i],0); for(let i=0;i<n;i++) u[i]-=dot*q[i]; } 
      const norm=Math.sqrt(u.reduce((s,x)=>s+x*x,0))||1; return u.map(x=>x/norm); };
    for(let t=0;t<200;t++){ v=gs(mult(v)); }
    const Kv=mult(v); const lam=v.reduce((s,x,i)=>s+x*Kv[i],0);
    vecs.push(v); vals.push(lam);
  }
  return {vecs, vals};
}

export default function KernelPCALab(){
  const [shape,setShape]=useState("moons");
  const [n,setN]=useState(200);
  const [sigma,setSigma]=useState(0.3);
  const [seed,setSeed]=useState(7);

  const X = useMemo(()=> shape==="moons" ? twoMoons(n,seed) : circles(n,seed),[shape,n,seed]);
  const K = useMemo(()=> rbfKernel(X, sigma),[X,sigma]);
  const {vecs, vals} = useMemo(()=> topEigen(K, 3),[K]);

  const Y = useMemo(()=>{
    if(vecs.length<2) return [];
    // project: y_i = [ sqrt(λ1) v1_i, sqrt(λ2) v2_i ]
    const s1=Math.sqrt(Math.max(1e-12, vals[0])), s2=Math.sqrt(Math.max(1e-12, vals[1]));
    return X.map((_,i)=> [ s1*vecs[0][i], s2*vecs[1][i] ]);
  },[vecs,vals,X]);

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">Kernel PCA — RBF embedding</h2>
      <Scatter pts={Y} />
      <div
        className="grid"
        style={{ gridTemplateColumns: '1fr 320px', gap: 16 }}
      >
        <div />
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <Radio
            name="shape"
            value={shape}
            set={setShape}
            opts={[
              ['moons', 'two moons'],
              ['circles', 'two circles'],
            ]}
          />
          <Slider
            label="per class n"
            v={n}
            set={setN}
            min={80}
            max={500}
            step={20}
          />
          <Slider
            label="σ (kernel)"
            v={sigma}
            set={setSigma}
            min={0.05}
            max={1.0}
            step={0.01}
          />
          <Slider
            label="seed"
            v={seed}
            set={setSeed}
            min={1}
            max={9999}
            step={1}
          />
      <Scatter pts={Y}/>
      <div className="grid" style={{gridTemplateColumns:"1fr 320px", gap:16}}>
        <div/>
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <Radio name="shape" value={shape} set={setShape} opts={[["moons","two moons"],["circles","two circles"]]}/>
          <Slider label="per class n" v={n} set={setN} min={80} max={500} step={20}/>
          <Slider label="σ (kernel)" v={sigma} set={setSigma} min={0.05} max={1.0} step={0.01}/>
          <Slider label="seed" v={seed} set={setSeed} min={1} max={9999} step={1}/>
          <ActiveReflection
            title="Active Reflection — Kernel PCA"
            storageKey="reflect_kpca"
            prompts={[
              'Small σ: local geometry; large σ: global averaging — when do clusters meld?',
              'Compare moons vs circles: which needs nonlinear features?',
              'Why are coordinates up to rotation/scale (eigenvector freedom)?',
              "Small σ: local geometry; large σ: global averaging — when do clusters meld?",
              "Compare moons vs circles: which needs nonlinear features?",
              "Why are coordinates up to rotation/scale (eigenvector freedom)?"
            ]}
          />
        </section>
      </div>
    </div>
  );
}
function Scatter({ pts }) {
  const W = 640,
    H = 360,
    pad = 20;
  if (!pts.length) return null;
  const xs = pts.map((p) => p[0]),
    ys = pts.map((p) => p[1]);
  const minX = Math.min(...xs),
    maxX = Math.max(...xs);
  const minY = Math.min(...ys),
    maxY = Math.max(...ys);
  const Xv = (x) => pad + ((x - minX) / (maxX - minX + 1e-9)) * (W - 2 * pad);
  const Yv = (y) =>
    H - pad - ((y - minY) / (maxY - minY + 1e-9)) * (H - 2 * pad);
  return (
    <section className="p-3 rounded-lg bg-white/5 border border-white/10">
      <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
        {pts.map((p, i) => (
          <circle key={i} cx={Xv(p[0])} cy={Yv(p[1])} r="3" />
        ))}
function Scatter({pts}){
  const W=640,H=360,pad=20; if(!pts.length) return null;
  const xs=pts.map(p=>p[0]), ys=pts.map(p=>p[1]);
  const minX=Math.min(...xs), maxX=Math.max(...xs);
  const minY=Math.min(...ys), maxY=Math.max(...ys);
  const Xv=x=> pad+(x-minX)/(maxX-minX+1e-9)*(W-2*pad);
  const Yv=y=> H-pad-(y-minY)/(maxY-minY+1e-9)*(H-2*pad);
  return (
    <section className="p-3 rounded-lg bg-white/5 border border-white/10">
      <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
        {pts.map((p,i)=> <circle key={i} cx={Xv(p[0])} cy={Yv(p[1])} r="3"/>) }
      </svg>
    </section>
  );
}
function Radio({ name, value, set, opts }) {
  return (
    <div className="flex gap-3 text-sm">
      {opts.map(([val, lab]) => (
        <label key={val} className="flex items-center gap-1">
          <input
            type="radio"
            name={name}
            checked={value === val}
            onChange={() => set(val)}
          />
          {lab}
        </label>
      ))}
    </div>
  );
}
function Slider({ label, v, set, min, max, step }) {
  const show = typeof v === 'number' && v.toFixed ? v.toFixed(2) : v;
  return (
    <div className="mb-2">
      <label className="text-sm opacity-80">
        {label}: <b>{show}</b>
      </label>
      <input
        className="w-full"
        type="range"
        min={min}
        max={max}
        step={step}
        value={v}
        onChange={(e) => set(parseFloat(e.target.value))}
      />
    </div>
  );
function Radio({name,value,set,opts}){
  return (<div className="flex gap-3 text-sm">
    {opts.map(([val,lab])=> <label key={val} className="flex items-center gap-1">
      <input type="radio" name={name} checked={value===val} onChange={()=>set(val)}/>{lab}
    </label>)}
  </div>);
}
function Slider({label,v,set,min,max,step}){ const show=(typeof v==='number'&&v.toFixed)?v.toFixed(2):v;
  return (<div className="mb-2"><label className="text-sm opacity-80">{label}: <b>{show}</b></label>
  <input className="w-full" type="range" min={min} max={max} step={step}
    value={v} onChange={e=>set(parseFloat(e.target.value))}/></div>);
}
