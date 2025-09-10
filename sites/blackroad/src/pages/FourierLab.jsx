import { useMemo, useState } from "react";

/* naive DFT for clarity (O(N^2)) */
function dft(x){
  const N = x.length; const re=[], im=[];
  for(let k=0;k<N;k++){
    let rk=0, ik=0;
    for(let n=0;n<N;n++){
      const ang = -2*Math.PI*k*n/N;
      rk += x[n]*Math.cos(ang);
      ik += x[n]*Math.sin(ang);
    }
    re.push(rk); im.push(ik);
  }
  return {re, im, mag: re.map((r,i)=>Math.hypot(r,im[i]))};
}
function linspace(N){ return Array.from({length:N},(_,i)=>i/N); }
function mkSignal(N, comps){
  const t=linspace(N); const y=new Array(N).fill(0);
  for(const c of comps){
    for(let n=0;n<N;n++){
      y[n]+= c.amp * Math.sin(2*Math.PI*(c.freq*t[n] + c.phase));
    }
  }
  return y;
}
function conv(a,b){
  const N=a.length, M=b.length, y=new Array(N+M-1).fill(0);
  for(let i=0;i<N;i++) for(let j=0;j<M;j++) y[i+j]+=a[i]*b[j];
  return y;
}

export default function FourierLab(){
  const [N,setN]=useState(128);
  const [a1,setA1]=useState(1.0), [f1,setF1]=useState(3), [p1,setP1]=useState(0.0);
  const [a2,setA2]=useState(0.7), [f2,setF2]=useState(7), [p2,setP2]=useState(0.0);
  const [kernel,setKernel]=useState(5);

  const x = useMemo(()=> mkSignal(N, [
    {amp:a1, freq:f1, phase:p1},
    {amp:a2, freq:f2, phase:p2},
  ]),[N,a1,f1,p1,a2,f2,p2]);

  const k = useMemo(()=>{
    // simple box or triangular kernel
    const L = Math.max(1,kernel|0);
    const arr = Array(L).fill(1/L);
    return arr;
  },[kernel]);

  const y = useMemo(()=>conv(x,k),[x,k]);
  const X = useMemo(()=>dft(x),[x]);
  const Y = useMemo(()=>dft(y.slice(0,N)),[y,N]);

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">Fourier & Convolution Playground</h2>
      <div className="grid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:16}}>
        <Panel title="Signal x[n]">
          <SignalPlot y={x}/>
          <Controls label="N" v={N} set={setN} min={64} max={512} step={64}/>
          <h4 className="font-semibold mt-2 text-sm">Component 1</h4>
          <Slider label="amp" v={a1} set={setA1} min={0} max={2} step={0.01}/>
          <Slider label="freq" v={f1} set={setF1} min={1} max={20} step={1}/>
          <Slider label="phase" v={p1} set={setP1} min={0} max={1} step={0.01}/>
          <h4 className="font-semibold mt-2 text-sm">Component 2</h4>
          <Slider label="amp" v={a2} set={setA2} min={0} max={2} step={0.01}/>
          <Slider label="freq" v={f2} set={setF2} min={1} max={20} step={1}/>
          <Slider label="phase" v={p2} set={setP2} min={0} max={1} step={0.01}/>
        </Panel>
        <Panel title="Convolution y = x * h">
          <SignalPlot y={y}/>
          <Slider label="kernel length" v={kernel} set={setKernel} min={3} max={33} step={2}/>
        </Panel>
        <Panel title="|DFT(x)| vs |DFT(y)|">
          <SpectrumPlot X={X.mag} Y={Y.mag}/>
          <p className="text-xs opacity-80 mt-2">Convolution in time ≈ multiplication in frequency (smoothing shrinks high-freqs).</p>
        </Panel>
      </div>
    </div>
  );
}

function Panel({title,children}){
  return <section className="p-3 rounded-lg bg-white/5 border border-white/10">
    <h3 className="font-semibold mb-2">{title}</h3>{children}
  </section>;
}
function Controls(props){ return <Slider {...props}/>; }
function Slider({label,v,set,min,max,step}){
  const show = typeof v==='number' && v.toFixed ? v.toFixed(3) : v;
  return (
    <div className="mb-1">
      <label className="text-sm opacity-80">{label}: <b>{show}</b></label>
      <input className="w-full" type="range" min={min} max={max} step={step}
             value={v} onChange={e=>set(parseFloat(e.target.value))}/>
    </div>
  );
}
function SignalPlot({y}){
  const W=620,H=160,pad=10;
  const N=y.length;
  const X=i=> pad + (i/(N-1))*(W-2*pad);
  const Y=v=> H-pad - ((v - Math.min(...y))/(Math.max(...y)-Math.min(...y)+1e-9))*(H-2*pad);
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
      <rect x="0" y="0" width={W} height={H} fill="none"/>
      {y.map((v,i)=>{
        const x1 = i? X(i-1): X(i), y1 = i? Y(y[i-1]): Y(v);
        const x2 = X(i), y2 = Y(v);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth="2"/>;
      })}
    </svg>
  );
}
function SpectrumPlot({X,Y}){
  const W=620,H=160,pad=10;
  const N=X.length;
  const maxVal = Math.max(...X, ...Y, 1e-9);
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
      <rect x="0" y="0" width={W} height={H} fill="none"/>
      {X.map((v,i)=>{
        const x = pad + i*( (W-2*pad)/N );
        const w = (W-2*pad)/N * 0.45;
        const h = (H-2*pad)*v/maxVal;
        return <rect key={`x${i}`} x={x} y={H-pad-h} width={w} height={h} rx="1" ry="1"/>;
      })}
      {Y.map((v,i)=>{
        const x = pad + i*( (W-2*pad)/N ) + ((W-2*pad)/N)*0.5;
        const w = (W-2*pad)/N * 0.45;
        const h = (H-2*pad)*v/maxVal;
        return <rect key={`y${i}`} x={x} y={H-pad-h} width={w} height={h} rx="1" ry="1"/>;
      })}
    </svg>
  );
}
