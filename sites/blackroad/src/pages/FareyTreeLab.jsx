import { useMemo, useState } from "react";

/* Stern–Brocot via mediants; depth-limited binary tree between 0/1 and 1/1 */
function buildSB(depth){
  const nodes=[{p:0,q:1,label:"0/1",x:0},{p:1,q:1,label:"1/1",x:1}];
  // store edges and new nodes per level
  for(let d=0; d<depth; d++){
    const next=[];
    for(let i=0;i<nodes.length-1;i++){
      const a=nodes[i], b=nodes[i+1];
      const p=a.p+b.p, q=a.q+b.q;
      const x=(a.x+b.x)/2;
      next.push(a, {p,q,label:`${p}/${q}`,x}, b);
    }
    // dedupe consecutive duplicates
    const merged=[next[0]];
    for(let k=1;k<next.length;k++){
      const prev=merged[merged.length-1], cur=next[k];
      if(!(prev.p===cur.p && prev.q===cur.q)) merged.push(cur);
    }
    nodes.length=0; nodes.push(...merged);
  }
  return nodes;
}

export default function FareyTreeLab(){
  const [depth,setDepth]=useState(6);
  const nodes = useMemo(()=>buildSB(depth),[depth]);

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">Farey / Stern–Brocot Tree</h2>
      <Controls label="depth" v={depth} set={setDepth} min={1} max={10} step={1}/>
      <Tree nodes={nodes}/>
      <Table nodes={nodes.slice(0,80)}/>
      <p className="text-sm opacity-80">
        Every positive rational appears exactly once. Mediants <code>(a+c)/(b+d)</code> sit between <code>a/b</code> and <code>c/d</code>.
      </p>
    </div>
  );
}

function Controls({label,v,set,min,max,step}){
  return (
    <div className="mb-1">
      <label className="text-sm opacity-80">{label}: <b>{v}</b></label>
      <input className="w-full" type="range" min={min} max={max} step={step}
        value={v} onChange={e=>set(parseInt(e.target.value))}/>
    </div>
  );
}

function Tree({nodes}){
  const W=640,H=160,pad=14;
  const Y = d=>{
    // rough level by denominator magnitude (log-ish)
    const q= d.q; return H - pad - Math.log2(q+1)/(Math.log2(64))*(H-2*pad);
  };
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
      <line x1={pad} y1={H-pad} x2={W-pad} y2={H-pad}/>
      {nodes.map((n,i)=>{
        const x = pad + n.x*(W-2*pad), y = Y(n);
        return <g key={i}>
          <circle cx={x} cy={y} r="3"/>
          <text x={x+4} y={y-4} fontSize="9">{n.label}</text>
        </g>;
      })}
    </svg>
  );
}
function Table({nodes}){
  return (
    <section className="p-3 rounded-lg bg-white/5 border border-white/10">
      <h3 className="font-semibold mb-2">First fractions</h3>
      <div className="text-xs" style={{columnCount:3, columnGap:16}}>
        {nodes.map((n,i)=><div key={i}>{n.label}</div>)}
      </div>
    </section>
  );
}
