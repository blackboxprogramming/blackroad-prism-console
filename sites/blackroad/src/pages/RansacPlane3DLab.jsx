import { useEffect, useMemo, useRef, useState } from "react";
import ActiveReflection from "./ActiveReflection.jsx";

// Plane: z = ax + by + c. Fit with RANSAC; refine with least squares on inliers.

export default function RansacPlane3DLab(){
  const [nIn,setNIn]=useState(180);
  const [nOut,setNOut]=useState(60);
  const [noise,setNoise]=useState(0.03);
  const [th,setTh]=useState(0.05);
  const [iters,setIters]=useState(1200);
  const [seed,setSeed]=useState(7);

  const data = useMemo(()=> makeData3D(nIn,nOut,noise,seed),[nIn,nOut,noise,seed]);
  const model = useMemo(()=> ransacPlane(data, th, iters),[data,th,iters]);

  const [yaw,setYaw]=useState(0.7), [pitch,setPitch]=useState(0.4), [spin,setSpin]=useState(0.01);
  useEffect(()=>{ const id=setInterval(()=> setYaw(y=>y+spin), 16); return ()=>clearInterval(id); },[spin]);

  const W=640,H=360;
  const cnv=useRef(null);
  useEffect(()=>{
    const c=cnv.current; if(!c) return; c.width=W; c.height=H;
    const ctx=c.getContext("2d",{alpha:false});
    drawScene(ctx, W, H, data, model, yaw, pitch);
  },[data,model,yaw,pitch]);

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">RANSAC Plane (3-D) — fit + viewing</h2>
      <canvas ref={cnv} style={{width:"100%"}}/>
      <div className="grid" style={{gridTemplateColumns:"1fr 360px", gap:16}}>
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <Slider label="inliers" v={nIn} set={setNIn} min={40} max={600} step={20}/>
          <Slider label="outliers" v={nOut} set={setNOut} min={0} max={400} step={20}/>
          <Slider label="noise σ" v={noise} set={setNoise} min={0} max={0.15} step={0.005}/>
          <Slider label="threshold" v={th} set={setTh} min={0.01} max={0.12} step={0.002}/>
          <Slider label="iterations" v={iters} set={setIters} min={100} max={4000} step={100}/>
          <Slider label="seed" v={seed} set={setSeed} min={1} max={9999} step={1}/>
        </section>
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <Slider label="yaw" v={yaw} set={setYaw} min={-Math.PI} max={Math.PI} step={0.01}/>
          <Slider label="pitch" v={pitch} set={setPitch} min={-1.2} max={1.2} step={0.01}/>
          <Slider label="spin" v={spin} set={setSpin} min={0} max={0.05} step={0.001}/>
          <p className="text-sm mt-2">Inliers: <b>{model.inliers.length}</b> • Plane: <code>z≈{model.a.toFixed(3)}x + {model.b.toFixed(3)}y + {model.c.toFixed(3)}</code></p>
          <ActiveReflection
            title="Active Reflection — RANSAC Plane"
            storageKey="reflect_ransac_plane"
            prompts={[
              "Increase outliers: when does plane flip?",
              "Threshold too tight rejects true inliers; too loose accepts junk.",
              "Noise ↑ needs more iterations; watch stability of (a,b,c)."
            ]}
          />
        </section>
      </div>
    </div>
  );
}

function makeData3D(nIn,nOut,noise,seed){
  let s=seed|0; const R=()=> (s=(1664525*s+1013904223)>>>0)/2**32;
  // random plane
  const a=0.4*(R()*2-1), b=0.4*(R()*2-1), c=0.2*(R()*2-1);
  const inl=Math.max(1,nIn|0), out=Math.max(0,nOut|0);
  const P=[];
  for(let i=0;i<inl;i++){
    const x=(R()*2-1), y=(R()*2-1), z=a*x + b*y + c + noise*(R()*2-1);
    P.push({x,y,z, inlier:true});
  }
  for(let i=0;i<out;i++){
    P.push({x:(R()*2-1), y:(R()*2-1), z:(R()*2-1), inlier:false});
  }
  return {pts:P, true:{a,b,c}};
}
function ransacPlane(data, th, iters){
  const P=data.pts; let best={a:0,b:0,c:0, inliers:[]};
  const d=(a,b,c,p)=> Math.abs(p.z - (a*p.x + b*p.y + c)) / Math.sqrt(a*a + b*b + 1);
  for(let k=0;k<iters;k++){
    // pick 3 unique points
    const i=(Math.random()*P.length)|0, j=(Math.random()*P.length)|0, l=(Math.random()*P.length)|0;
    if(i===j||j===l||i===l) continue;
    const p1=P[i], p2=P[j], p3=P[l];
    // fit plane through 3 points (solve for a,b,c in z=ax+by+c)
    const A=[[p1.x,p1.y,1],[p2.x,p2.y,1],[p3.x,p3.y,1]];
    const z=[p1.z,p2.z,p3.z];
    const M=inv3(A); if(!M) continue;
    const a=M[0][0]*z[0]+M[0][1]*z[1]+M[0][2]*z[2];
    const b=M[1][0]*z[0]+M[1][1]*z[1]+M[1][2]*z[2];
    const c=M[2][0]*z[0]+M[2][1]*z[1]+M[2][2]*z[2];
    const inl=[];
    for(let t=0;t<P.length;t++) if(d(a,b,c,P[t])<th) inl.push(t);
    if(inl.length>best.inliers.length){
      // refine LS on inliers
      const LS = leastSquares(P, inl);
      best={a:LS.a,b:LS.b,c:LS.c,inliers:inl};
    }
  }
  return best;
}
function leastSquares(P, idxs){
  // normal equations on z=ax+by+c
  let Sx=0,Sy=0,Sxx=0,Syy=0,Sxy=0,Sz=0,Sxz=0,Syz=0,n=idxs.length;
  for(const id of idxs){
    const p=P[id]; Sx+=p.x; Sy+=p.y; Sz+=p.z; Sxx+=p.x*p.x; Syy+=p.y*p.y; Sxy+=p.x*p.y; Sxz+=p.x*p.z; Syz+=p.y*p.z;
  }
  // [ [Sxx,Sxy,Sx], [Sxy,Syy,Sy], [Sx,Sy,n] ] * [a,b,c]^T = [Sxz, Syz, Sz]^T
  const A=[[Sxx,Sxy,Sx],[Sxy,Syy,Sy],[Sx,Sy,n]];
  const b=[Sxz,Syz,Sz];
  const M=inv3(A); if(!M) return {a:0,b:0,c:0};
  const a=M[0][0]*b[0]+M[0][1]*b[1]+M[0][2]*b[2];
  const b2=M[1][0]*b[0]+M[1][1]*b[1]+M[1][2]*b[2];
  const c=M[2][0]*b[0]+M[2][1]*b[1]+M[2][2]*b[2];
  return {a,b:b2,c};
}
function inv3(A){
  const [a,b,c,d,e,f,g,h,i]=[A[0][0],A[0][1],A[0][2],A[1][0],A[1][1],A[1][2],A[2][0],A[2][1],A[2][2]];
  const det=a*(e*i-f*h)-b*(d*i-f*g)+c*(d*h-e*g); if(Math.abs(det)<1e-12) return null;
  const inv=[[ (e*i-f*h), -(b*i-c*h), (b*f-c*e)],
             [-(d*i-f*g),  (a*i-c*g), -(a*f-c*d)],
             [ (d*h-e*g), -(a*h-b*g), (a*e-b*d)]].map(row=> row.map(v=> v/det));
  return inv;
}
function drawScene(ctx,W,H,data, model, yaw, pitch){
  ctx.fillStyle="rgb(10,12,18)"; ctx.fillRect(0,0,W,H);
  const R=(p)=> rotate(p, yaw, pitch);
  const P=(p)=> proj(R(p), W,H);
  // axes
  drawAxes(ctx, W,H, yaw, pitch);
  // inliers (bright) / outliers (dim)
  for(const p of data.pts){
    const q=P(p); ctx.beginPath(); ctx.arc(q[0],q[1], p.inlier? 2.6 : 2, 0, Math.PI*2);
    ctx.fillStyle = p.inlier? "rgba(200,220,255,0.95)" : "rgba(200,220,255,0.35)"; ctx.fill();
  }
  // plane patch
  if(model.inliers.length){
    ctx.strokeStyle="#fff"; ctx.lineWidth=1.5;
    const a=model.a,b=model.b,c=model.c;
    const poly=[];
    for(const xy of [[-1,-1],[1,-1],[1,1],[-1,1]]){
      const x=xy[0], y=xy[1], z=a*x+b*y+c; const q=P({x,y,z}); poly.push(q);
    }
    ctx.beginPath(); ctx.moveTo(poly[0][0],poly[0][1]); for(let k=1;k<poly.length;k++) ctx.lineTo(poly[k][0],poly[k][1]); ctx.closePath(); ctx.stroke();
  }
}
function rotate(p, yaw, pitch){
  const cy=Math.cos(yaw), sy=Math.sin(yaw); const cp=Math.cos(pitch), sp=Math.sin(pitch);
  // yaw about z, then pitch about x
  const x1=cy*p.x - sy*p.y, y1=sy*p.x + cy*p.y, z1=p.z;
  const y2=cp*y1 - sp*z1, z2=sp*y1 + cp*z1;
  return {x:x1,y:y2,z:z2};
}
function proj(p,W,H){ const d=3.2, z=p.z+d; const s=150/z; return [W/2 + s*p.x, H/2 - s*p.y]; }
function drawAxes(ctx,W,H,yaw,pitch){
  const axes=[{p:{x:1.2,y:0,z:0},c:"#ff8d8d"},{p:{x:0,y:1.2,z:0},c:"#8dff8d"},{p:{x:0,y:0,z:1.2},c:"#8dbbff"}];
  const O=proj(rotate({x:0,y:0,z:0},yaw,pitch),W,H);
  for(const a of axes){
    const Q=proj(rotate(a.p,yaw,pitch),W,H);
    ctx.beginPath(); ctx.moveTo(O[0],O[1]); ctx.lineTo(Q[0],Q[1]); ctx.strokeStyle=a.c; ctx.lineWidth=2; ctx.stroke();
  }
}
function Slider({label,v,set,min,max,step}){ const show=(typeof v==='number'&&v.toFixed)?v.toFixed(3):v;
  return (<div className="mb-2"><label className="text-sm opacity-80">{label}: <b>{show}</b></label>
   <input className="w-full" type="range" min={min} max={max} step={step}
    value={v} onChange={e=>set(parseFloat(e.target.value))}/></div>);
}

