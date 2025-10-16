import { useEffect, useRef, useState } from "react";
import ActiveReflection from "./ActiveReflection.jsx";

// De Casteljau for cubic Bézier
function bezier(P,t){
  const lerp=(a,b,u)=> a+(b-a)*u;
  let [x0,y0]=P[0], [x1,y1]=P[1], [x2,y2]=P[2], [x3,y3]=P[3];
  const ax=lerp(x0,x1,t), ay=lerp(y0,y1,t);
  const bx=lerp(x1,x2,t), by=lerp(y1,y2,t);
  const cx=lerp(x2,x3,t), cy=lerp(y2,y3,t);
  const dx=lerp(ax,bx,t), dy=lerp(ay,by,t);
  const ex=lerp(bx,cx,t), ey=lerp(by,cy,t);
  return [lerp(dx,ex,t), lerp(dy,ey,t)];
}
// Uniform quadratic B-spline with 5 control points (piecewise)
function bsplineQ(P, t){
  // t in [0,1], map to segment k=0..2
  const u = t*3, k = Math.min(2, Math.floor(u)), s = u - k;
  const B = (k)=>P[k];
  const blend=(p0,p1,p2,s)=>{
    const x = ( (1-s)*(1-s)*p0[0] + 2*(1-s)*s*p1[0] + s*s*p2[0] )/1;
    const y = ( (1-s)*(1-s)*p0[1] + 2*(1-s)*s*p1[1] + s*s*p2[1] )/1;
    return [x,y];
  };
  return blend(B(k), B(k+1), B(k+2), s);
}

export default function BezierBSplineLab(){
  const W=640,H=360;
  const [P,setP]=useState([[80,280],[160,60],[460,60],[560,280]]);          // 4 ctrl (Bezier)
  const [Q,setQ]=useState([[60,300],[160,80],[320,200],[480,80],[580,300]]); // 5 ctrl (B-spline)
  const [drag,setDrag]=useState(null); // {set:'P'|'Q', idx}

  const svgRef=useRef(null);
  useEffect(()=>{
    const svg=svgRef.current; if(!svg) return;
    const onDown=(e)=>{
      const rect = svg.getBoundingClientRect();
      const x = e.clientX-rect.left, y=e.clientY-rect.top;
      const hit = hitTest(x,y);
      if(hit) setDrag(hit);
    };
    const onMove=(e)=>{
      if(!drag) return;
      const rect = svg.getBoundingClientRect();
      const x = Math.max(0, Math.min(W, e.clientX-rect.left));
      const y = Math.max(0, Math.min(H, e.clientY-rect.top));
      if(drag.set==='P'){ const c=P.slice(); c[drag.idx]=[x,y]; setP(c); }
      else { const c=Q.slice(); c[drag.idx]=[x,y]; setQ(c); }
    };
    const onUp=()=> setDrag(null);
    svg.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return ()=>{ svg.removeEventListener('mousedown', onDown); window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  },[drag,P,Q]);

  function hitTest(x,y){
    const d2=(a,b)=> (a[0]-x)**2+(a[1]-y)**2;
    const rad2=10**2;
    for(let i=0;i<P.length;i++) if(d2(P[i],[x,y])<rad2) return {set:'P', idx:i};
    for(let i=0;i<Q.length;i++) if(d2(Q[i],[x,y])<rad2) return {set:'Q', idx:i};
    return null;
  }

  const bez = sampleCurve(t=>bezier(P,t));
  const bsp = sampleCurve(t=>bsplineQ(Q,t));

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">Bézier vs B-spline — control geometry</h2>
      <svg ref={svgRef} width="100%" viewBox={`0 0 ${W} ${H}`} style={{touchAction:'none'}}>
        <rect x="0" y="0" width={W} height={H} fill="none"/>
        {/* Bezier control polygon */}
        <polyline points={P.map(p=>p.join(',')).join(' ')} fill="none" strokeWidth="1"/>
        {/* B-spline control polygon */}
        <polyline points={Q.map(p=>p.join(',')).join(' ')} fill="none" strokeWidth="1"/>
        {/* Curves */}
        <polyline points={bez.map(p=>p.join(',')).join(' ')} fill="none" strokeWidth="3"/>
        <polyline points={bsp.map(p=>p.join(',')).join(' ')} fill="none" strokeWidth="3"/>
        {/* control points */}
        {P.map((p,i)=><circle key={`bp${i}`} cx={p[0]} cy={p[1]} r="6"/>) }
        {Q.map((p,i)=><rect key={`sp${i}`} x={p[0]-5} y={p[1]-5} width="10" height="10"/>) }
        <text x={10} y={16} fontSize="12">Circles = Bézier ctrl; Squares = B-spline ctrl. Drag to explore.</text>
      </svg>
      <ActiveReflection
        title="Active Reflection — Bézier/B-spline"
        storageKey="reflect_bez"
        prompts={[
          "Move a single Bézier control point: curve obeys global influence (all segments).",
          "Move a middle B-spline point: influence stays local — which span moves?",
          "How do polygons vs curves relate at endpoints (interpolation vs approximation)?"
        ]}
      />
    </div>
  );
}
function sampleCurve(f, K=200){ return Array.from({length:K+1},(_,i)=> f(i/K)); }
