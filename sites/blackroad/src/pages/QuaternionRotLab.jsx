import { useMemo, useState } from "react";
import ActiveReflection from "./ActiveReflection.jsx";

function qmul([x1,y1,z1,w1],[x2,y2,z2,w2]){
  return [
    w1*x2 + x1*w2 + y1*z2 - z1*y2,
    w1*y2 - x1*z2 + y1*w2 + z1*x2,
    w1*z2 + x1*y2 - y1*x2 + z1*w2,
    w1*w2 - x1*x2 - y1*y2 - z1*z2
  ];
}
function qnorm(q){ const n=Math.hypot(...q); return q.map(v=>v/n); }
function qfromAxis([ax,ay,az], ang){ const s=Math.sin(ang/2); return qnorm([ax*s,ay*s,az*s,Math.cos(ang/2)]); }
function qrot(q, v){ // v: 3D
  const p=[v[0],v[1],v[2],0];
  const qi=[-q[0],-q[1],-q[2],q[3]];
  const r=qmul(qmul(q,p),qi);
  return [r[0],r[1],r[2]];
}

export default function QuaternionRotLab(){
  const [yaw,setYaw]=useState(0.5), [pitch,setPitch]=useState(0.2), [roll,setRoll]=useState(-0.1);
  const [dist,setDist]=useState(3.5);
  const [scale,setScale]=useState(160);

  const q = useMemo(()=>{
    // yaw (y), pitch (x), roll (z)
    const qy=qfromAxis([0,1,0], yaw);
    const qx=qfromAxis([1,0,0], pitch);
    const qz=qfromAxis([0,0,1], roll);
    return qmul(qy, qmul(qx,qz)); // Y * (X * Z)
  },[yaw,pitch,roll]);

  const cube = useMemo(()=>{
    const pts=[];
    for(const s of [-1,1]) for(const t of [-1,1]) for(const u of [-1,1]) pts.push([s,t,u]);
    return pts;
  },[]);

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">Quaternion Rotation — cube & axes</h2>
      <Cube q={q} dist={dist} scale={scale} cube={cube}/>
      <div className="grid" style={{gridTemplateColumns:'1fr 320px', gap:16}}>
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <Slider label="yaw" v={yaw} set={setYaw} min={-Math.PI} max={Math.PI} step={0.01}/>
          <Slider label="pitch" v={pitch} set={setPitch} min={-Math.PI/2} max={Math.PI/2} step={0.01}/>
          <Slider label="roll" v={roll} set={setRoll} min={-Math.PI} max={Math.PI} step={0.01}/>
          <Slider label="camera dist" v={dist} set={setDist} min={2} max={6} step={0.05}/>
          <Slider label="scale" v={scale} set={setScale} min={80} max={260} step={5}/>
        </section>
        <ActiveReflection
          title="Active Reflection — Quaternion"
          storageKey="reflect_quat_rot"
          prompts={[
            "Change yaw/pitch/roll: which ordering effects do you notice?",
            "Rotate so the z-axis points at you: how do axes project?",
            "Why is quaternion composition non-commutative like matrices?"
          ]}
        />
      </div>
    </div>
  );
}

function Cube({q, dist, scale, cube}){
  const W=640,H=360, pad=16;
  const proj=(p)=>{ const z=p[2]+dist; const f=scale/(z||1e-9); return [W/2 + f*p[0], H/2 - f*p[1]]; };
  const rot = (p)=> qrot(q,p);
  // edges
  const edges=[];
  for(let i=0;i<cube.length;i++) for(let j=i+1;j<cube.length;j++){
    const d = Math.abs(cube[i][0]-cube[j][0]) + Math.abs(cube[i][1]-cube[j][1]) + Math.abs(cube[i][2]-cube[j][2]);
    if(d===2) edges.push([i,j]);
  }
  // axes
  const axes=[
    {p:[1.5,0,0], c:"axisX"}, {p:[0,1.5,0], c:"axisY"}, {p:[0,0,1.5], c:"axisZ"}
  ];
  return (
    <section className="p-3 rounded-lg bg-white/5 border border-white/10">
      <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
        {/* axes */}
        {axes.map((a,i)=>{
          const p1=proj(rot([0,0,0])), p2=proj(rot(a.p));
          return <line key={i} x1={p1[0]} y1={p1[1]} x2={p2[0]} y2={p2[1]} strokeWidth="3"/>;
        })}
        {/* cube edges */}
        {edges.map(([i,j],k)=>{
          const p1=proj(rot(cube[i])), p2=proj(rot(cube[j]));
          return <line key={k} x1={p1[0]} y1={p1[1]} x2={p2[0]} y2={p2[1]} strokeWidth="2"/>;
        })}
      </svg>
    </section>
  );
}
function Slider({label,v,set,min,max,step}){
  const show=(typeof v==='number'&&v.toFixed)?v.toFixed(3):v;
  return (<div className="mb-2"><label className="text-sm opacity-80">{label}: <b>{show}</b></label>
  <input className="w-full" type="range" min={min} max={max} step={step}
    value={v} onChange={e=>set(parseFloat(e.target.value))}/></div>);
}

