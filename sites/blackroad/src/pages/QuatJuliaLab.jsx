import { useEffect, useRef, useState } from "react";
import ActiveReflection from "./ActiveReflection.jsx";

/** Quaternion Julia with ray-marched distance estimator.
 *  q_{n+1} = q_n^2 + C, where q = (x,y,z,w). We render a 3D slice (w fixed).
 *  Reference DE idea: |dq| ≈ 2|q|*|dq|; distance ~ 0.5*|q|*ln|q|/|dq|.
 */
function qMul(a,b){ // Hamilton product
  const [ax,ay,az,aw]=a,[bx,by,bz,bw]=b;
  return [
    aw*bx + ax*bw + ay*bz - az*by,
    aw*by - ax*bz + ay*bw + az*bx,
    aw*bz + ax*by - ay*bx + az*bw,
    aw*bw - ax*bx - ay*by - az*bz
  ];
}
function qLen([x,y,z,w]){ return Math.hypot(x,y,z,w); }
function qAdd(a,b){ return a.map((v,i)=>v+b[i]); }
function qScale(a,s){ return a.map(v=>v*s); }

function deQuatJulia(p, C, maxIter=30){
  // iterate q and derivative dq (as 4x4 Jacobian * v; here track scalar mag via chain)
  let q=[p[0],p[1],p[2],p[3]], dq=1.0;
  let r=0;
  for(let i=0;i<maxIter;i++){
    // q^2 + C
    const q2 = qMul(q,q);
    q = qAdd(q2, C);
    r = qLen(q);
    dq = 2*r*dq;                // rough growth of derivative magnitude
    if(r>4.0) break;
  }
  if(r<=4.0) return 0.0;        // likely inside
  const dist = 0.5*Math.log(r)*r/dq; // standard DE heuristic
  return dist;
}

export default function QuatJuliaLab(){
  const cnv = useRef(null);
  const [cx,setCX]=useState(0.0), [cy,setCY]=useState(0.0), [cz,setCZ]=useState(0.0), [cw,setCW]=useState(-0.2);
  const [fov,setFov]=useState(1.3), [iters,setIters]=useState(40), [step,setStep]=useState(0.9);
  const [yaw,setYaw]=useState(0.9), [pitch,setPitch]=useState(0.3), [zoom,setZoom]=useState(2.4);

  useEffect(()=>{
    const W=640,H=400;
    const c=cnv.current; if(!c) return; c.width=W; c.height=H;
    const ctx=c.getContext("2d",{alpha:false});
    const img=ctx.createImageData(W,H);

    const C=[cx,cy,cz,cw];
    // camera
    const sinY=Math.sin(yaw), cosY=Math.cos(yaw);
    const sinP=Math.sin(pitch), cosP=Math.cos(pitch);
    const camForward=[cosP*cosY, sinP, cosP*sinY];
    const up=[0,1,0];
    const cr = [ camForward[2]*up[1]-camForward[1]*up[2], camForward[0]*up[2]-camForward[2]*up[0], camForward[1]*up[0]-camForward[0]*up[1] ];
    const right = norm(cr);
    const trueUp = cross(right, camForward);

    for(let y=0;y<H;y++){
      for(let x=0;x<W;x++){
        const u = (2*x/W-1)*fov, v = (1-2*y/H)*fov;
        let dir = add( scale(right,u), add( scale(trueUp,v), camForward ) );
        dir = norm(dir);
        let ro=[0,0,zoom]; // camera at +z
        // raymarch
        let t=0.0, hit=false, glow=0;
        for(let s=0;s<128;s++){
          const pos=[ro[0]+dir[0]*t, ro[1]+dir[1]*t, ro[2]+dir[2]*t];
          // embed into quaternion (w = cw slice)
          const q=[pos[0],pos[1],pos[2], cw];
          const d = deQuatJulia(q, C, iters);
          if(d<1e-3){ hit=true; break; }
          t += Math.max(0.001, d*step);
          glow += 0.04*Math.exp(-d*10);
          if(t>12) break;
        }
        let r=0,g=0,b=0;
        if(hit){
          // simple shading by step count glow
          r = Math.min(255, Math.floor(200 + 55*glow));
          g = Math.min(255, Math.floor(170 + 55*glow));
          b = Math.min(255, Math.floor(210 + 55*glow));
        }else{
          r = Math.floor(20 + 80*glow);
          g = Math.floor(25 + 90*glow);
          b = Math.floor(35 + 110*glow);
        }
        const off=4*(y*W+x);
        img.data[off]=r; img.data[off+1]=g; img.data[off+2]=b; img.data[off+3]=255;
      }
    }
    ctx.putImageData(img,0,0);
  },[cx,cy,cz,cw,fov,iters,step,yaw,pitch,zoom]);

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">Quaternion Julia — 3D Raymarch</h2>
      <canvas ref={cnv} style={{width:"100%", maxWidth:640, height:400}}/>
      <div className="grid" style={{gridTemplateColumns:'1fr 320px', gap:16}}>
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <Slider label="Re(Cx)" v={cx} set={setCX} min={-1.2} max={1.2} step={0.002}/>
          <Slider label="Im(Cy)" v={cy} set={setCY} min={-1.2} max={1.2} step={0.002}/>
          <Slider label="Cz" v={cz} set={setCZ} min={-1.2} max={1.2} step={0.002}/>
          <Slider label="Cw (slice)" v={cw} set={setCW} min={-1.2} max={1.2} step={0.002}/>
          <Slider label="iters" v={iters} set={setIters} min={10} max={80} step={1}/>
          <Slider label="step scale" v={step} set={setStep} min={0.5} max={2.0} step={0.01}/>
          <Slider label="yaw" v={yaw} set={setYaw} min={-Math.PI} max={Math.PI} step={0.01}/>
          <Slider label="pitch" v={pitch} set={setPitch} min={-1.2} max={1.2} step={0.01}/>
          <Slider label="zoom" v={zoom} set={setZoom} min={1.2} max={4.0} step={0.01}/>
        </section>
        <ActiveReflection
          title="Active Reflection — Quat Julia"
          storageKey="reflect_quatj"
          prompts={[
            "How does changing Cw (the slice) alter topology? Find a value where tunnels appear.",
            "Increase iters: where do features stabilize vs. continue to sharpen?",
            "Yaw/pitch/zoom sweeps: can you find filaments that repeat self-similarly?"
          ]}
        />
      </div>
    </div>
  );
}
function norm(v){ const n=Math.hypot(...v)||1; return v.map(x=>x/n); }
function add(a,b){ return a.map((x,i)=>x+b[i]); }
function scale(a,s){ return a.map(x=>x*s); }
function cross(a,b){ return [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]]; }

function Slider({label,v,set,min,max,step}){
  const show=(typeof v==='number'&&v.toFixed)?v.toFixed(3):v;
  return (<div className="mb-2"><label className="text-sm opacity-80">{label}: <b>{show}</b></label>
  <input className="w-full" type="range" min={min} max={max} step={step}
    value={v} onChange={e=>set(parseFloat(e.target.value))}/></div>);
}
