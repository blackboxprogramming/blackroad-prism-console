import { useEffect, useRef, useState } from "react";
import ActiveReflection from "./ActiveReflection.jsx";

function draw(ctx,W,H,cx,cy,scale,iters,ca,cb,p){
  const img=ctx.createImageData(W,H);
  for(let y=0;y<H;y++){
    for(let x=0;x<W;x++){
      let zx = cx + (x/W - 0.5)*2*scale;
      let zy = cy + (y/H - 0.5)*2*scale*H/W;
      let k=0;
      for(;k<iters;k++){
        // z^p + c in polar form
        const r = Math.hypot(zx,zy), t = Math.atan2(zy,zx);
        const rp = Math.pow(r,p);
        const tp = p*t;
        zx = rp*Math.cos(tp) + ca;
        zy = rp*Math.sin(tp) + cb;
        if(zx*zx+zy*zy > 256) break;
      }
      let R=0,G=0,B=0;
      if(k<iters){
        const mod = Math.hypot(zx,zy);
        const mu  = k + 1 - Math.log(Math.log(mod))/Math.log(p);
        const t   = 0.025*mu;
        R = Math.floor(180 + 75*Math.sin(t));
        G = Math.floor(180 + 75*Math.sin(t+2.094));
        B = Math.floor(180 + 75*Math.sin(t+4.188));
      }
      const off=4*(y*W+x);
      img.data[off]=R; img.data[off+1]=G; img.data[off+2]=B; img.data[off+3]=255;
    }
  }
  ctx.putImageData(img,0,0);
}

export default function PowerJuliaLab(){
  const cnv=useRef(null);
  const [cx,setCX]=useState(0), [cy,setCY]=useState(0);
  const [scale,setScale]=useState(1.7);
  const [iters,setIters]=useState(220);
  const [ca,setCA]=useState(-0.4), [cb,setCB]=useState(0.6);
  const [p,setP]=useState(3);

  useEffect(()=>{
    const W=640,H=480;
    const c=cnv.current; if(!c) return; c.width=W; c.height=H;
    const ctx=c.getContext("2d",{alpha:false});
    draw(ctx,W,H,cx,cy,scale,iters,ca,cb,p);
  },[cx,cy,scale,iters,ca,cb,p]);

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">Complex Dynamics Zoo — z^p + c</h2>
      <canvas ref={cnv} style={{width:"100%", maxWidth:640, height:480}}/>
      <div className="grid" style={{gridTemplateColumns:'1fr 320px', gap:16}}>
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <Slider label="Re(c)" v={ca} set={setCA} min={-1.5} max={1.5} step={0.001}/>
          <Slider label="Im(c)" v={cb} set={setCB} min={-1.5} max={1.5} step={0.001}/>
          <Slider label="power p" v={p} set={setP} min={2} max={8} step={1}/>
          <Slider label="scale" v={scale} set={setScale} min={0.2} max={2.5} step={0.001}/>
          <Slider label="iterations" v={iters} set={setIters} min={60} max={1000} step={10}/>
        </section>
        <ActiveReflection
          title="Active Reflection — Power Julia"
          storageKey="reflect_powerjulia"
          prompts={[
            "Compare p=2 vs p=3+: how do filaments and bulbs change?",
            "Which c produce connected vs dust-like sets?",
            "Increase iterations: which features converge slowly?"
          ]}
        />
      </div>
    </div>
  );
}
function Slider({label,v,set,min,max,step}){
  const show=(typeof v==='number'&&v.toFixed)?v.toFixed(3):v;
  return (<div className="mb-2"><label className="text-sm opacity-80">{label}: <b>{show}</b></label>
    <input className="w-full" type="range" min={min} max={max} step={step}
      value={v} onChange={e=>set(parseFloat(e.target.value))}/></div>);
}
