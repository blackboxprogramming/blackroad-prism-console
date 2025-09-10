import { useEffect, useRef, useState } from "react";
import ActiveReflection from "./ActiveReflection.jsx";

/** Integer area-preserving map: [x';y'] = A [x;y] (mod N), A = [[1,1],[1,2]]. */
export default function CatMapLab(){
  const [N,setN]=useState(192);
  const [iters,setIters]=useState(1);
  const [speed,setSpeed]=useState(1);
  const [pattern,setPattern]=useState("heart"); // heart | checker | ring
  const cnv=useRef(null);

  useEffect(()=>{
    const c=cnv.current; if(!c) return; c.width=N; c.height=N;
    const ctx=c.getContext("2d",{alpha:false});
    let img = makePattern(N, pattern);
    let t=0, raf;
    const step=()=>{
      for(let k=0;k<iters;k++) img = catStep(img);
      draw(ctx, img);
      t+=speed; raf=requestAnimationFrame(step);
    };
    step(); return ()=> cancelAnimationFrame(raf);
  },[N,iters,speed,pattern]);

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">Arnold’s Cat Map — mixing</h2>
      <canvas ref={cnv} style={{width:"100%", imageRendering:"pixelated"}}/>
      <div className="grid" style={{gridTemplateColumns:"1fr 320px", gap:16}}>
        <div />
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <Radio name="pattern" value={pattern} set={setPattern} opts={[["heart","heart"],["checker","checker"],["ring","ring"]]}/>
          <Slider label="grid N" v={N} set={setN} min={128} max={320} step={32}/>
          <Slider label="iters/frame" v={iters} set={setIters} min={1} max={6} step={1}/>
          <Slider label="speed" v={speed} set={setSpeed} min={0} max={2} step={0.1}/>
          <ActiveReflection
            title="Active Reflection — Cat Map"
            storageKey="reflect_cat"
            prompts={[
              "Watch mixing: structure scrambles but area is preserved.",
              "Change N: map cycles; find the cycle length for your N.",
              "Try ‘heart’ vs ‘checker’: which reveals stretching best?"
            ]}
          />
        </section>
      </div>
    </div>
  );
}
function catStep(img){
  const N=img.width; const out=new ImageData(N,N);
  const A=[[1,1],[1,2]];
  for(let y=0;y<N;y++) for(let x=0;x<N;x++){
    const nx=(A[0][0]*x + A[0][1]*y) % N;
    const ny=(A[1][0]*x + A[1][1]*y) % N;
    const s4=4*(y*N + x), d4=4*(ny*N + nx);
    out.data[d4  ]=img.data[s4  ];
    out.data[d4+1]=img.data[s4+1];
    out.data[d4+2]=img.data[s4+2];
    out.data[d4+3]=255;
  }
  return out;
}
function makePattern(N, type){
  const img=new ImageData(N,N);
  for(let y=0;y<N;y++) for(let x=0;x<N;x++){
    let v=0;
    if(type==="checker") v=((x>>4)^(y>>4))&1;
    else if(type==="ring"){ const r=((x-N/2)**2+(y-N/2)**2)**0.5; v=(r>N*0.18 && r<N*0.22)?1:0; }
    else { // heart curve fill
      const X=(x-N/2)/28, Y=-(y-N/2)/28;
      const f=(X*X+Y*Y-1)**3 - X*X*Y*Y*Y;
      v = f<=0 ? 1 : 0;
    }
    const off=4*(y*N+x);
    const shade=v?255:0;
    img.data[off]=shade; img.data[off+1]=shade; img.data[off+2]=shade; img.data[off+3]=255;
  }
  return img;
}
function draw(ctx,img){ ctx.putImageData(img,0,0); }
function Slider({label,v,set,min,max,step}){ const show=(typeof v==="number"&&v.toFixed)?v.toFixed(2):v;
  return (<div className="mb-2"><label className="text-sm opacity-80">{label}: <b>{show}</b></label>
    <input className="w-full" type="range" min={min} max={max} step={step}
           value={v} onChange={e=>set(parseFloat(e.target.value))}/></div>);
}
function Radio({name,value,set,opts}){
  return (<div className="flex gap-3 text-sm">
    {opts.map(([val,lab])=> <label key={val} className="flex items-center gap-1">
      <input type="radio" name={name} checked={value===val} onChange={()=>set(val)}/>{lab}
    </label>)}
  </div>);
}
