import { useEffect, useMemo, useRef, useState } from "react";
import ActiveReflection from "./ActiveReflection.jsx";

export default function FourierOpticsLab(){
  const [N,setN]=useState(128);
  const [ap,setAp]=useState("circle");
  const [param,setParam]=useState(0.3); // radius or slit width
  const cnvA=useRef(null), cnvF=useRef(null);

  const A = useMemo(()=>makeAperture(N, ap, param),[N,ap,param]);
  const F = useMemo(()=>dft2(A),[A]); // returns magnitude

  useEffect(()=>{ drawField(cnvA.current, A, false); drawField(cnvF.current, F, true); },[A,F]);

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">Fourier Optics — Aperture vs Diffraction</h2>
      <div className="grid" style={{gridTemplateColumns:'1fr 1fr', gap:16}}>
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <h3 className="font-semibold mb-2">Aperture</h3>
          <canvas ref={cnvA} style={{width:"100%", imageRendering:"pixelated"}}/>
        </section>
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <h3 className="font-semibold mb-2">Diffraction (|F|², log)</h3>
          <canvas ref={cnvF} style={{width:"100%", imageRendering:"pixelated"}}/>
        </section>
      </div>
      <div className="grid" style={{gridTemplateColumns:'1fr 320px', gap:16}}>
        <div />
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <Radio name="ap" value={ap} set={setAp} opts={[["circle","circle"],["slit","slit"],["rect","rect"],["checker","checker"]]} />
          <Slider label="param" v={param} set={setParam} min={0.05} max={0.5} step={0.01}/>
          <Slider label="grid N" v={N} set={setN} min={64} max={192} step={16}/>
          <ActiveReflection
            title="Active Reflection — Fourier Optics"
            storageKey="reflect_fourier"
            prompts={[
              "Circle aperture → Airy pattern; slit → sinc fringes. Do you see reciprocity?",
              "Halve aperture width: do fringes spread (Fourier duality)?",
              "What symmetries of aperture appear in the diffraction?"
            ]}
          />
        </section>
      </div>
    </div>
  );
}

function makeAperture(N, ap, p){
  const A=Array.from({length:N},()=>Array(N).fill(0));
  for(let y=0;y<N;y++) for(let x=0;x<N;x++){
    const X=(x+0.5)/N-0.5, Y=(y+0.5)/N-0.5;
    let v=0;
    if(ap==="circle") v=(Math.hypot(X,Y)<=p)?1:0;
    else if(ap==="slit") v=(Math.abs(X)<=p*0.2)?1:0;
    else if(ap==="rect") v=(Math.abs(X)<=p && Math.abs(Y)<=p*0.6)?1:0;
    else if(ap==="checker"){ const s=p*4; v=((Math.floor((X+0.5)/s)+Math.floor((Y+0.5)/s))%2===0)?1:0; }
    A[y][x]=v;
  }
  return A;
}
function dft2(A){
  const N=A.length, M=A[0].length;
  const mag=Array.from({length:N},()=>Array(M).fill(0));
  for(let u=0;u<N;u++){
    for(let v=0;v<M;v++){
      let re=0, im=0;
      for(let y=0;y<N;y++) for(let x=0;x<M;x++){
        const ang=-2*Math.PI*(u*x/N + v*y/M);
        const c=Math.cos(ang), s=Math.sin(ang);
        re += A[y][x]*c; im += A[y][x]*s;
      }
      const m = re*re + im*im;
      mag[u][v]=m;
    }
  }
  // shift to center & log scale
  const B=Array.from({length:N},()=>Array(M).fill(0));
  let mx=0; for(let u=0;u<N;u++) for(let v=0;v<M;v++) mx=Math.max(mx,mag[u][v]);
  for(let u=0;u<N;u++) for(let v=0;v<M;v++){
    const us=(u+N/2|0)%N, vs=(v+M/2|0)%M;
    B[us][vs]=Math.log(1+mag[u][v]/(mx+1e-9));
  }
  return B;
}
function drawField(canvas, A, hot){
  if(!canvas) return; const N=A.length, M=A[0].length; canvas.width=N; canvas.height=M;
  const ctx=canvas.getContext("2d",{alpha:false}); const img=ctx.createImageData(N,M);
  let mx=0; for(let y=0;y<N;y++) for(let x=0;x<N;x++) mx=Math.max(mx,A[y][x]);
  for(let y=0;y<N;y++) for(let x=0;x<N;x++){
    const t=A[y][x]/(mx+1e-9);
    const off=4*(y*N+x);
    // gentle palette
    const R=Math.floor(40+200*t), G=Math.floor(50+180*(1-t)), B=Math.floor(220*(1-t));
    img.data[off]=R; img.data[off+1]=G; img.data[off+2]=B; img.data[off+3]=255;
  }
  ctx.putImageData(img,0,0);
}
function Radio({name,value,set,opts}){
  return (<div className="flex gap-3 text-sm">
    {opts.map(([val,lab])=><label key={val} className="flex items-center gap-1">
      <input type="radio" name={name} checked={value===val} onChange={()=>set(val)}/>{lab}
    </label>)}
  </div>);
}
function Slider({label,v,set,min,max,step}){
  const show=(typeof v==='number'&&v.toFixed)?v.toFixed(3):v;
  return (<div className="mb-2"><label className="text-sm opacity-80">{label}: <b>{show}</b></label>
    <input className="w-full" type="range" min={min} max={max} step={step}
      value={v} onChange={e=>set(parseFloat(e.target.value))}/></div>);
}

