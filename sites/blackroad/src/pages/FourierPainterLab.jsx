import { useEffect, useMemo, useRef, useState } from "react";
import ActiveReflection from "./ActiveReflection.jsx";

// simple DFT of a polyline (complex samples), draw epicycles at t∈[0,1)
function dft(samples){
  const N=samples.length, out=[];
  for(let k=-(N>>2); k<=(N>>2); k++){ // a small band around 0
    let re=0, im=0;
    for(let n=0;n<N;n++){
      const ang=-2*Math.PI*k*n/N;
      re += samples[n][0]*Math.cos(ang) - samples[n][1]*Math.sin(ang);
      im += samples[n][0]*Math.sin(ang) + samples[n][1]*Math.cos(ang);
    }
    re/=N; im/=N; out.push({k, re, im, amp:Math.hypot(re,im), phase:Math.atan2(im,re)});
  }
  out.sort((a,b)=> b.amp - a.amp);
  return out;
}
function synth(coeffs, t){
  let x=0,y=0;
  for(const c of coeffs){
    const ang=2*Math.PI*c.k*t + c.phase;
    x += c.amp*Math.cos(ang);
    y += c.amp*Math.sin(ang);
  }
  return {x,y};
}

export default function FourierPainterLab(){
  const [W,H]=[640,360];
  const [points,setPoints]=useState(()=> heartSamples(W,H));
  const [terms,setTerms]=useState(40);
  const coeffsAll = useMemo(()=> dft(points),[points]);
  const coeffs = useMemo(()=> coeffsAll.slice(0, terms),[coeffsAll,terms]);

  const cnv=useRef(null);
  useEffect(()=>{
    const c=cnv.current; if(!c) return; c.width=W; c.height=H;
    const ctx=c.getContext("2d",{alpha:false});
    let t=0;
    const trail=[];
    const loop=()=>{
      t=(t+0.003) % 1;
      // background
      ctx.fillStyle="rgb(10,12,18)"; ctx.fillRect(0,0,W,H);
      // epicycles
      let ox=W/2, oy=H/2;
      for(const c of coeffs){
        const ang=2*Math.PI*c.k*t + c.phase;
        const r=c.amp;
        const nx=ox + r*Math.cos(ang), ny=oy + r*Math.sin(ang);
        ctx.beginPath(); ctx.arc(ox,oy,r,0,Math.PI*2); ctx.strokeStyle="rgba(200,220,255,0.15)"; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ox,oy); ctx.lineTo(nx,ny); ctx.strokeStyle="rgba(255,255,255,0.7)"; ctx.stroke();
        ox=nx; oy=ny;
      }
      trail.push([ox,oy]); if(trail.length>1200) trail.shift();
      ctx.beginPath(); for(let i=0;i<trail.length;i++){ if(i===0) ctx.moveTo(trail[i][0],trail[i][1]); else ctx.lineTo(trail[i][0],trail[i][1]); }
      ctx.strokeStyle="#fff"; ctx.lineWidth=2; ctx.stroke();
      requestAnimationFrame(loop);
    };
    loop();
  },[W,H,coeffs]);

  // mouse draw new shape
  useEffect(()=>{
    const c=cnv.current; if(!c) return;
    let drawing=false; const newPts=[];
    const down=e=>{ drawing=true; newPts.length=0; add(e); };
    const move=e=>{ if(drawing) add(e); };
    const up=()=>{ drawing=false; if(newPts.length>20) setPoints(resample(newPts, 256)); };
    function add(e){
      const r=c.getBoundingClientRect(); const x=e.clientX-r.left, y=e.clientY-r.top;
      newPts.push([x - W/2, y - H/2]);
    }
    c.addEventListener("mousedown",down);
    window.addEventListener("mousemove",move);
    window.addEventListener("mouseup",up);
    return ()=>{ c.removeEventListener("mousedown",down); window.removeEventListener("mousemove",move); window.removeEventListener("mouseup",up); };
  },[W,H]);

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">Fourier Series Painter — epicycles</h2>
      <canvas ref={cnv} style={{width:"100%", imageRendering:"pixelated"}}/>
      <div className="grid" style={{gridTemplateColumns:"1fr 320px", gap:16}}>
        <div />
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <Slider label="# terms" v={terms} set={setTerms} min={5} max={120} step={1}/>
          <p className="text-sm mt-2">Tip: draw with mouse to feed a new contour; it’ll get resampled & traced.</p>
          <ActiveReflection
            title="Active Reflection — Epicycles"
            storageKey="reflect_epicycles"
            prompts={[
              "Increase terms: where does detail return first?",
              "Why do high |k| terms add fine wiggles vs low terms shaping the whole?",
              "How does re-centering to canvas center affect DC term?"
            ]}
          />
        </section>
      </div>
    </div>
  );
}
function resample(pts, N){
  // uniform arclength resample
  let L=[0]; for(let i=1;i<pts.length;i++) L[i]=L[i-1]+Math.hypot(pts[i][0]-pts[i-1][0], pts[i][1]-pts[i-1][1]);
  const T=L[L.length-1]; if(T===0) return pts;
  const out=[]; for(let k=0;k<N;k++){
    const s=k*T/(N-1); let i=1; while(i<L.length && L[i]<s) i++;
    const t=(s-L[i-1])/(L[i]-L[i-1]||1e-9);
    const x=pts[i-1][0]*(1-t)+pts[i][0]*t, y=pts[i-1][1]*(1-t)+pts[i][1]*t; out.push([x,y]);
  }
  return out;
}
function heartSamples(W,H){
  // param heart curve
  const N=256, out=[];
  for(let i=0;i<N;i++){
    const t=2*Math.PI*i/N;
    const x=16*Math.pow(Math.sin(t),3);
    const y=13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t);
    out.push([x*7, -y*7]); // scaled and upright
  }
  return out;
}
function Slider({label,v,set,min,max,step}){
  const show= (typeof v==='number'&&v.toFixed) ? v.toFixed(0) : v;
  return (<div className="mb-2"><label className="text-sm opacity-80">{label}: <b>{show}</b></label>
   <input className="w-full" type="range" min={min} max={max} step={step}
    value={v} onChange={e=>set(parseFloat(e.target.value))}/></div>);
}

