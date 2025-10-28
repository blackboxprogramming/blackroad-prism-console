import { useMemo, useState } from 'react';
import ActiveReflection from './ActiveReflection.jsx';

/** Fit y ~ poly_d(x) with ridge λ; show prediction vs truth and error vs λ. */

function design(X, d) {
  return X.map((x) => {
    const row = [];
    for (let k = 0; k <= d; k++) row.push(Math.pow(x, k));
    return row;
  });
}
function matMul(A, B) {
  const m = A.length,
    n = A[0].length,
    p = B[0].length;
  const C = Array.from({ length: m }, () => Array(p).fill(0));
  for (let i = 0; i < m; i++)
    for (let k = 0; k < n; k++)
      for (let j = 0; j < p; j++) C[i][j] += A[i][k] * B[k][j];
  return C;
}
function matT(A) {
  const m = A.length,
    n = A[0].length;
  const T = Array.from({ length: n }, () => Array(m).fill(0));
  for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) T[j][i] = A[i][j];
  return T;
}
function eye(n) {
  const I = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) I[i][i] = 1;
  return I;
}
function addMat(A, B) {
  return A.map((r, i) => r.map((v, j) => v + B[i][j]));
}
function invGauss(A) {
  const n = A.length;
  const M = A.map((r) => r.slice());
  const I = eye(n);
  for (let col = 0; col < n; col++) {
    // pivot
    let piv = col;
    for (let r = col + 1; r < n; r++)
      if (Math.abs(M[r][col]) > Math.abs(M[piv][col])) piv = r;
    if (Math.abs(M[piv][col]) < 1e-12) continue;
    [M[col], M[piv]] = [M[piv], M[col]];
    [I[col], I[piv]] = [I[piv], I[col]];
    const f = M[col][col];
    for (let j = 0; j < n; j++) {
      M[col][j] /= f;
      I[col][j] /= f;
    }
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const g = M[r][col];
      for (let j = 0; j < n; j++) {
        M[r][j] -= g * M[col][j];
        I[r][j] -= g * I[col][j];
      }
import { useMemo, useState } from "react";
import ActiveReflection from "./ActiveReflection.jsx";

/** Fit y ~ poly_d(x) with ridge λ; show prediction vs truth and error vs λ. */

function design(X, d){
  return X.map(x=>{
    const row=[]; for(let k=0;k<=d;k++) row.push(Math.pow(x,k)); return row;
  });
}
function matMul(A,B){ const m=A.length, n=A[0].length, p=B[0].length; const C=Array.from({length:m},()=>Array(p).fill(0));
  for(let i=0;i<m;i++) for(let k=0;k<n;k++) for(let j=0;j<p;j++) C[i][j]+=A[i][k]*B[k][j];
  return C;
}
function matT(A){ const m=A.length, n=A[0].length; const T=Array.from({length:n},()=>Array(m).fill(0));
  for(let i=0;i<m;i++) for(let j=0;j<n;j++) T[j][i]=A[i][j]; return T;
}
function eye(n){ const I=Array.from({length:n},()=>Array(n).fill(0)); for(let i=0;i<n;i++) I[i][i]=1; return I; }
function addMat(A,B){ return A.map((r,i)=> r.map((v,j)=> v+B[i][j])); }
function invGauss(A){
  const n=A.length; const M=A.map(r=>r.slice()); const I=eye(n);
  for(let col=0; col<n; col++){
    // pivot
    let piv=col; for(let r=col+1;r<n;r++) if(Math.abs(M[r][col])>Math.abs(M[piv][col])) piv=r;
    if(Math.abs(M[piv][col])<1e-12) continue;
    [M[col],M[piv]]=[M[piv],M[col]]; [I[col],I[piv]]=[I[piv],I[col]];
    const f=M[col][col];
    for(let j=0;j<n;j++){ M[col][j]/=f; I[col][j]/=f; }
    for(let r=0;r<n;r++){
      if(r===col) continue;
      const g=M[r][col];
      for(let j=0;j<n;j++){ M[r][j]-=g*M[col][j]; I[r][j]-=g*I[col][j]; }
    }
  }
  return I;
}
function ridgeFit(X, y, lam) {
  const XT = matT(X);
  const A = addMat(matMul(XT, X), scaleMat(eye(X[0].length), lam));
  const b = matMul(
    XT,
    y.map((v) => [v])
  );
  const Ainv = invGauss(A);
  const w = matMul(Ainv, b);
  return w.map((r) => r[0]);
}
function scaleMat(A, s) {
  return A.map((r) => r.map((v) => v * s));
}

function f_true(x) {
  return Math.sin(2 * Math.PI * x) + 0.5 * Math.cos(5 * Math.PI * x);
}
function makeData(n, noise, seed = 7) {
  let s = seed | 0;
  const R = () => (s = (1664525 * s + 1013904223) >>> 0) / 2 ** 32;
  const X = Array.from({ length: n }, () => R());
  const y = X.map((x) => f_true(x) + noise * (R() * 2 - 1));
  return { X, y };
}
function predict(w, d, xs) {
  return xs.map((x) => w.reduce((s, wi, i) => s + wi * Math.pow(x, i), 0));
}
function mse(yhat, y) {
  const n = y.length;
  let e = 0;
  for (let i = 0; i < n; i++) e += (yhat[i] - y[i]) ** 2;
  return e / n;
}

export default function RidgeRegressionLab() {
  const [n, setN] = useState(30);
  const [noise, setNoise] = useState(0.2);
  const [deg, setDeg] = useState(12);
  const [lambda, setLambda] = useState(1e-2);
  const [seed, setSeed] = useState(7);

  const { X, y } = useMemo(() => makeData(n, noise, seed), [n, noise, seed]);
  const grid = useMemo(
    () => Array.from({ length: 300 }, (_, i) => i / 299),
    []
  );
  const lamGrid = useMemo(
    () => Array.from({ length: 40 }, (_, i) => Math.pow(10, -4 + i * (8 / 39))),
    []
  ); // 1e-4..1e4

  const fit = useMemo(() => {
    const Phi = design(X, deg);
    const w = ridgeFit(Phi, y, lambda);
    const yhat = predict(w, deg, X);
    const PhiTest = design(grid, deg);
    const ygrid = predict(w, deg, grid);
    const eTrain = mse(yhat, y);
    const yTrueGrid = grid.map(f_true);
    const eTest = mse(ygrid, yTrueGrid);
    return { w, ygrid, eTrain, eTest };
  }, [X, y, deg, lambda, grid]);

  const curves = useMemo(() => {
    const Phi = design(X, deg);
    const yTrueGrid = grid.map(f_true);
    const errs = lamGrid.map((L) => {
      const w = ridgeFit(Phi, y, L);
      const yhat = predict(w, deg, X);
      const eTr = mse(yhat, y);
      const ygrid = predict(w, deg, grid);
      const eTe = mse(ygrid, yTrueGrid);
      return [L, eTr, eTe];
    });
    return errs;
  }, [X, y, deg, lamGrid, grid]);

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">
        Ridge Regression — Bias/Variance Feel
      </h2>
      <FitPlot grid={grid} ygrid={fit.ygrid} />
      <ErrPlot errs={curves} lambda={lambda} />
      <div
        className="grid"
        style={{ gridTemplateColumns: '1fr 360px', gap: 16 }}
      >
        <div />
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <Slider
            label="samples n"
            v={n}
            set={setN}
            min={10}
            max={120}
            step={5}
          />
          <Slider
            label="noise"
            v={noise}
            set={setNoise}
            min={0.0}
            max={0.6}
            step={0.01}
          />
          <Slider
            label="degree d"
            v={deg}
            set={setDeg}
            min={1}
            max={20}
            step={1}
          />
          <Slider
            label="λ (ridge)"
            v={lambda}
            set={setLambda}
            min={1e-4}
            max={1e4}
            step={0.001}
            log
          />
          <Slider
            label="seed"
            v={seed}
            set={setSeed}
            min={1}
            max={9999}
            step={1}
          />
          <p className="text-sm mt-2">
            Train MSE: <b>{fit.eTrain.toFixed(3)}</b> • Test MSE:{' '}
            <b>{fit.eTest.toFixed(3)}</b>
          </p>
function ridgeFit(X, y, lam){
  const XT=matT(X); const A=addMat(matMul(XT,X), scaleMat(eye(X[0].length), lam));
  const b=matMul(XT, y.map(v=>[v]));
  const Ainv=invGauss(A); const w=matMul(Ainv, b); return w.map(r=>r[0]);
}
function scaleMat(A,s){ return A.map(r=>r.map(v=>v*s)); }

function f_true(x){ return Math.sin(2*Math.PI*x) + 0.5*Math.cos(5*Math.PI*x); }
function makeData(n, noise, seed=7){
  let s=seed|0; const R=()=> (s=(1664525*s+1013904223)>>>0)/2**32;
  const X=Array.from({length:n},()=> R()); const y=X.map(x=> f_true(x) + noise*(R()*2-1));
  return {X,y};
}
function predict(w, d, xs){ return xs.map(x=> w.reduce((s,wi,i)=> s + wi*Math.pow(x,i), 0)); }
function mse(yhat, y){ const n=y.length; let e=0; for(let i=0;i<n;i++) e+=(yhat[i]-y[i])**2; return e/n; }

export default function RidgeRegressionLab(){
  const [n,setN]=useState(30);
  const [noise,setNoise]=useState(0.2);
  const [deg,setDeg]=useState(12);
  const [lambda,setLambda]=useState(1e-2);
  const [seed,setSeed]=useState(7);

  const {X,y} = useMemo(()=> makeData(n, noise, seed),[n,noise,seed]);
  const grid = useMemo(()=> Array.from({length:300},(_,i)=> i/299),[]);
  const lamGrid = useMemo(()=> Array.from({length:40},(_,i)=> Math.pow(10, -4 + i*(8/39))),[]); // 1e-4..1e4

  const fit = useMemo(()=>{
    const Phi = design(X, deg); const w=ridgeFit(Phi, y, lambda);
    const yhat = predict(w,deg,X);
    const PhiTest = design(grid, deg); const ygrid=predict(w,deg,grid);
    const eTrain = mse(yhat,y);
    const yTrueGrid = grid.map(f_true); const eTest = mse(ygrid, yTrueGrid);
    return {w, ygrid, eTrain, eTest};
  },[X,y,deg,lambda,grid]);

  const curves = useMemo(()=>{
    const Phi=design(X,deg);
    const yTrueGrid=grid.map(f_true);
    const errs=lamGrid.map(L=>{
      const w=ridgeFit(Phi,y,L);
      const yhat=predict(w,deg,X);
      const eTr=mse(yhat,y);
      const ygrid=predict(w,deg,grid);
      const eTe=mse(ygrid, yTrueGrid);
      return [L,eTr,eTe];
    });
    return errs;
  },[X,y,deg,lamGrid,grid]);

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">Ridge Regression — Bias/Variance Feel</h2>
      <FitPlot grid={grid} ygrid={fit.ygrid}/>
      <ErrPlot errs={curves} lambda={lambda}/>
      <div className="grid" style={{gridTemplateColumns:"1fr 360px", gap:16}}>
        <div/>
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <Slider label="samples n" v={n} set={setN} min={10} max={120} step={5}/>
          <Slider label="noise" v={noise} set={setNoise} min={0.0} max={0.6} step={0.01}/>
          <Slider label="degree d" v={deg} set={setDeg} min={1} max={20} step={1}/>
          <Slider label="λ (ridge)" v={lambda} set={setLambda} min={1e-4} max={1e4} step={0.001} log/>
          <Slider label="seed" v={seed} set={setSeed} min={1} max={9999} step={1}/>
          <p className="text-sm mt-2">Train MSE: <b>{fit.eTrain.toFixed(3)}</b> • Test MSE: <b>{fit.eTest.toFixed(3)}</b></p>
          <ActiveReflection
            title="Active Reflection — Ridge"
            storageKey="reflect_ridge"
            prompts={[
              'Vary λ: watch bias↑ / variance↓ as λ grows.',
              'At high degree, small λ overfits; ridge cures it — where’s sweet spot?',
              'Noise↑ raises irreducible error — how do curves shift?',
              "Vary λ: watch bias↑ / variance↓ as λ grows.",
              "At high degree, small λ overfits; ridge cures it — where’s sweet spot?",
              "Noise↑ raises irreducible error — how do curves shift?"
            ]}
          />
        </section>
      </div>
    </div>
  );
}

function FitPlot({ grid, ygrid }) {
  const W = 640,
    H = 280,
    pad = 16;
  const yTrue = grid.map(f_true);
  const minY = Math.min(...yTrue, ...ygrid),
    maxY = Math.max(...yTrue, ...ygrid);
  const X = (i) => pad + (i / (grid.length - 1)) * (W - 2 * pad);
  const Y = (v) =>
    H - pad - ((v - minY) / (maxY - minY + 1e-9)) * (H - 2 * pad);
  const poly = (a) => a.map((v, i) => `${X(i)},${Y(v)}`).join(' ');
function FitPlot({grid, ygrid}){
  const W=640,H=280,pad=16;
  const yTrue=grid.map(f_true);
  const minY=Math.min(...yTrue,...ygrid), maxY=Math.max(...yTrue,...ygrid);
  const X=i=> pad + (i/(grid.length-1))*(W-2*pad);
  const Y=v=> H-pad - ((v-minY)/(maxY-minY+1e-9))*(H-2*pad);
  const poly=(a)=> a.map((v,i)=>`${X(i)},${Y(v)}`).join(" ");
  return (
    <section className="p-3 rounded-lg bg-white/5 border border-white/10">
      <h3 className="font-semibold mb-2">Prediction vs Truth</h3>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
        <polyline points={poly(yTrue)} fill="none" strokeWidth="2" />
        <polyline
          points={poly(ygrid)}
          fill="none"
          strokeWidth="2"
          opacity="0.7"
        />
        <polyline points={poly(yTrue)} fill="none" strokeWidth="2"/>
        <polyline points={poly(ygrid)} fill="none" strokeWidth="2" opacity="0.7"/>
      </svg>
    </section>
  );
}
function ErrPlot({ errs, lambda }) {
  const W = 640,
    H = 220,
    pad = 16;
  const Xlog = (L) => pad + ((Math.log10(L) - -4) / 8) * (W - 2 * pad);
  const Yerr = (e) => H - pad - (1 - 1 / (1 + e)) * (H - 2 * pad); // squash
  const selX = Xlog(lambda);
function ErrPlot({errs, lambda}){
  const W=640,H=220,pad=16;
  const Xlog=L=> pad + (Math.log10(L)-(-4))/(8)*(W-2*pad);
  const Yerr=e=> H-pad - (1 - 1/(1+e))*(H-2*pad); // squash
  const selX=Xlog(lambda);
  return (
    <section className="p-3 rounded-lg bg-white/5 border border-white/10">
      <h3 className="font-semibold mb-2">MSE vs λ (log)</h3>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
        {/* train */}
        <path
          d={`M ${errs.map(([L, eTr]) => `${Xlog(L)},${Yerr(eTr)}`).join(' L ')}`}
          fill="none"
          strokeWidth="2"
        />
        {/* test */}
        <path
          d={`M ${errs.map(([L, _, eTe]) => `${Xlog(L)},${Yerr(eTe)}`).join(' L ')}`}
          fill="none"
          strokeWidth="2"
          opacity="0.7"
        />
        <line x1={selX} x2={selX} y1={pad} y2={H - pad} strokeWidth="1.5" />
        <path d={`M ${errs.map(([L,eTr])=> `${Xlog(L)},${Yerr(eTr)}`).join(" L ")}`} fill="none" strokeWidth="2"/>
        {/* test */}
        <path d={`M ${errs.map(([L,_,eTe])=> `${Xlog(L)},${Yerr(eTe)}`).join(" L ")}`} fill="none" strokeWidth="2" opacity="0.7"/>
        <line x1={selX} x2={selX} y1={pad} y2={H-pad} strokeWidth="1.5" />
      </svg>
    </section>
  );
}
function Slider({ label, v, set, min, max, step, log = false }) {
  const display = () =>
    log
      ? v.toExponential(2)
      : typeof v === 'number' && v.toFixed
        ? v.toFixed(3)
        : v;
  const change = (e) => {
    const raw = parseFloat(e.target.value);
function Slider({label,v,set,min,max,step,log=false}){
  const display = ()=> log ? v.toExponential(2) : (typeof v==="number"&&v.toFixed ? v.toFixed(3):v);
  const change = (e)=>{
    const raw=parseFloat(e.target.value);
    set(log ? Math.pow(10, raw) : raw);
  };
  const val = log ? Math.log10(v) : v;
  const minv = log ? Math.log10(min) : min;
  const maxv = log ? Math.log10(max) : max;
  const stepv = log ? (Math.log10(max) - Math.log10(min)) / 500 : step;
  return (
    <div className="mb-2">
      <label className="text-sm opacity-80">
        {label}: <b>{display()}</b>
      </label>
      <input
        className="w-full"
        type="range"
        min={minv}
        max={maxv}
        step={stepv}
        value={val}
        onChange={change}
      />
  const stepv= log ? (Math.log10(max)-Math.log10(min))/500 : step;
  return (
    <div className="mb-2">
      <label className="text-sm opacity-80">{label}: <b>{display()}</b></label>
      <input className="w-full" type="range" min={minv} max={maxv} step={stepv} value={val} onChange={change}/>
    </div>
  );
}
