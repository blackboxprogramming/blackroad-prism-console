import { useMemo, useState } from "react";

function simulate(r, iters=1200, burn=200, x0=0.123456){
  let x = x0;
  const pts=[];
  for(let i=0;i<iters;i++){
    x = r*x*(1-x);
    if(i>=burn) pts.push(x);
  }
  return pts;
}
function lyapunov(r, iters=2000, burn=500, x0=0.123456){
  let x=x0, s=0;
  for(let i=0;i<iters;i++){
    x = r*x*(1-x);
    if(i>=burn){
      const der = Math.abs(r*(1-2*x));
      s += Math.log(der + 1e-12);
    }
  }
  return s/(iters-burn);
}

export default function BifurcationLab(){
  const [rMin,setRMin] = useState(2.5);
  const [rMax,setRMax] = useState(4.0);
  const [cols,setCols] = useState(400);

  const data = useMemo(()=>{
    const arr=[];
    for(let j=0;j<cols;j++){
      const r = rMin + (rMax-rMin)*j/(cols-1);
      const ys = simulate(r);
      arr.push({r, ys, lyap: lyapunov(r)});
    }
    return arr;
  },[rMin,rMax,cols]);

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">Logistic Map — Bifurcation & Lyapunov</h2>
      <div className="grid" style={{gridTemplateColumns:'1fr 280px', gap:16}}>
        <BifurcationPlot data={data}/>
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <h3 className="font-semibold mb-2">Controls</h3>
          <Slider label="r min" v={rMin} set={setRMin} min={2.5} max={4.0} step={0.01}/>
          <Slider label="r max" v={rMax} set={setRMax} min={2.5} max={4.0} step={0.01}/>
          <Slider label="columns" v={cols} set={setCols} min={150} max={1000} step={50}/>
          <p className="text-sm opacity-80 mt-2">Lyapunov &gt; 0 ≈ chaos.</p>
        </section>
      </div>
    </div>
  );
}

function Slider({label,v,set,min,max,step}){
  return (
    <div className="mb-2">
      <label className="text-sm opacity-80">{label}: <b>{v.toFixed(3)}</b></label>
      <input className="w-full" type="range" min={min} max={max} step={step}
             value={v} onChange={e=>set(parseFloat(e.target.value))}/>
    </div>
  );
}

function BifurcationPlot({data}){
  const W=640, H=360, pad=8;
  const xScale = (r, rMin=data[0].r, rMax=data[data.length-1].r)=>
      pad + (W-2*pad)*(r-rMin)/(rMax-rMin);
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
      <rect x="0" y="0" width={W} height={H} fill="none" />
      {data.map((col, j)=>(
        <g key={j} opacity={0.8}>
          {col.ys.map((y,i)=>{
            const x = xScale(col.r);
            const ypix = (H-2*pad)*(1-y)+pad;
            return <circle key={i} cx={x} cy={ypix} r={0.25} />;
          })}
          {/* Lyapunov color bar along bottom */}
          {(()=>{
            const yb = H-2; const x = xScale(col.r); const w=(W-16)/data.length;
            const l = col.lyap; // color by sign
            const alpha = Math.min(1, Math.abs(l)*3);
            const fill = l>0 ? `rgba(255,0,0,${alpha})` : `rgba(0,0,255,${alpha})`;
            return <rect x={x} y={yb} width={w} height={2} style={{fill}} />;
          })()}
        </g>
      ))}
    </svg>
  );
}
