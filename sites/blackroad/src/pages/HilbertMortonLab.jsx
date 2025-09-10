import { useMemo, useState } from "react";
import ActiveReflection from "./ActiveReflection.jsx";

function mortonXY(i, nBits){
  // deinterleave bits to (x,y)
  const deB=(v)=>{ v&=0x55555555; v=(v|v>>>1)&0x33333333; v=(v|v>>>2)&0x0F0F0F0F; v=(v|v>>>4)&0x00FF00FF; v=(v|v>>>8)&0x0000FFFF; return v; };
  const x=deB(i); const y=deB(i>>>1); const mask=(1<<nBits)-1;
  return [x&mask, y&mask];
}
function hilbertXY(i, nBits){
  // hilbert index to (x,y) (Butz algorithm, simplified for small nBits)
  let x=0,y=0, t=i;
  for(let s=1; s<(1<<nBits); s<<=1){
    const rx = 1 & (t>>>1);
    const ry = 1 & (t ^ rx);
    if(ry===0){
      if(rx===1){ x = s-1 - x; y = s-1 - y; }
      const tmp=x; x=y; y=tmp;
    }
    x += s*rx; y += s*ry; t >>>= 2;
  }
  return [x,y];
}

export default function HilbertMortonLab(){
  const [bits,setBits]=useState(5); // 32x32
  const [mode,setMode]=useState("hilbert"); // or morton
  const N=1<<bits;
  const pts = useMemo(()=>{
    const out=[];
    for(let i=0;i<N*N;i++){
      const [x,y] = mode==="hilbert" ? hilbertXY(i,bits) : mortonXY(i,bits);
      out.push([x,y]);
    }
    return out;
  },[bits,mode]);

  const W=640,H=360,pad=20;
  const X=x=> pad + (x/(N-1))*(W-2*pad);
  const Y=y=> H-pad - (y/(N-1))*(H-2*pad);

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">Hilbert vs Morton (Z-order)</h2>
      <section className="p-3 rounded-lg bg-white/5 border border-white/10">
        <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
          <rect x="0" y="0" width={W} height={H} fill="none"/>
          {pts.map((p,i)=> i>0 ? <line key={i} x1={X(pts[i-1][0])} y1={Y(pts[i-1][1])} x2={X(p[0])} y2={Y(p[1])} strokeWidth="1"/> : null)}
        </svg>
      </section>
      <div className="grid" style={{gridTemplateColumns:"1fr 320px", gap:16}}>
        <div/>
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <Radio name="mode" value={mode} set={setMode} opts={[["hilbert","hilbert"],["morton","morton (Z)"]]}/>
          <Slider label="order bits" v={bits} set={setBits} min={3} max={7} step={1}/>
          <ActiveReflection
            title="Active Reflection — Space Filling"
            storageKey="reflect_hilbert"
            prompts={[
              "Compare locality: which curve keeps neighbors closer when jumping?",
              "Increase bits: where do macro patterns repeat self-similarly?",
              "Why does Hilbert beat Morton for cache locality in many tasks?"
            ]}
          />
        </section>
      </div>
    </div>
  );
}
function Slider({label,v,set,min,max,step}){ return (
  <div className="mb-2"><label className="text-sm opacity-80">{label}: <b>{v}</b></label>
  <input className="w-full" type="range" min={min} max={max} step={step} value={v}
   onChange={e=>set(parseInt(e.target.value))}/></div>
);}
function Radio({name,value,set,opts}){
  return (<div className="flex gap-3 text-sm">
    {opts.map(([val,lab])=><label key={val} className="flex items-center gap-1">
      <input type="radio" name={name} checked={value===val} onChange={()=>set(val)}/>{lab}
    </label>)}
  </div>);
}

