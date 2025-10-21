import { useEffect, useMemo, useRef, useState } from "react";
import ActiveReflection from "./ActiveReflection.jsx";

function potential(x,y, charges){
  let phi=0; for(const c of charges){
    const dx=x-c.x, dy=y-c.y; const r=Math.hypot(dx,dy)||1e-6;
    phi += c.q * Math.log(r); // 2D electrostatics (log potential)
  }
  return phi;
}
function field(x,y, charges){
  let Ex=0, Ey=0; for(const c of charges){
    const dx=x-c.x, dy=y-c.y; const r2=dx*dx+dy*dy+1e-6;
    Ex += c.q * dx/r2; Ey += c.q * dy/r2;
  }
  return [Ex, Ey];
}

export default function ComplexPotentialsLab(){
  const [W,H]=[640,400];
  const [charges,setCharges]=useState([
    {x: 0.3, y:0.5, q:+1},
    {x: 0.7, y:0.5, q:-1},
  ]);
  const chargesRef = useRef(charges);
  useEffect(() => { chargesRef.current = charges; }, [charges]);
  const [arrows,setArrows]=useState(24);
  const [levels,setLevels]=useState(14);

  const cnv=useRef(null);
  useEffect(()=>{
    const c=cnv.current; if(!c) return; c.width=W; c.height=H;
    const ctx=c.getContext("2d",{alpha:false});
    // background potential colormap
    const img=ctx.createImageData(W,H);
    // sample coarse min/max
    let mn=Infinity, mx=-Infinity;
    for(let y=0;y<H;y+=8) for(let x=0;x<W;x+=8){
      const phi=potential(x/W,1-y/H,charges); if(phi<mn) mn=phi; if(phi>mx) mx=phi;
    }
    for(let y=0;y<H;y++){
      for(let x=0;x<W;x++){
        const phi=potential(x/W,1-y/H,charges);
        const z=(phi-mn)/(mx-mn+1e-9);
        const off=4*(y*W+x);
        img.data[off]=Math.floor(40+200*z);
        img.data[off+1]=Math.floor(50+180*(1-z));
        img.data[off+2]=Math.floor(220*(1-z));
        img.data[off+3]=255;
      }
    }
    ctx.putImageData(img,0,0);
    // equipotential contours (marching squares on the fly)
    const N=levels;
    for(let k=1;k<N;k++){
      const target = mn + (mx-mn)*k/N;
      ctx.strokeStyle="rgba(255,255,255,0.5)"; ctx.lineWidth=1;
      ctx.beginPath();
      for(let y=1;y<H;y++){
        for(let x=1;x<W;x++){
          const f=(xx,yy)=> potential(xx/W,1-yy/H,charges);
          const f00 = f(x-1,y-1), f10 = f(x,y-1), f11 = f(x,y), f01 = f(x-1,y);
          const s = (f00>target) | ((f10>target)<<1) | ((f11>target)<<2) | ((f01>target)<<3);
          // draw a simple horizontal/vertical segment for common cases (toy)
          if(s===1||s===14){ ctx.moveTo(x-1,y-0.5); ctx.lineTo(x-0.5,y-1); }
          else if(s===2||s===13){ ctx.moveTo(x-0.5,y-1); ctx.lineTo(x,y-0.5); }
          else if(s===4||s===11){ ctx.moveTo(x,y-0.5); ctx.lineTo(x-0.5,y); }
          else if(s===8||s===7){ ctx.moveTo(x-0.5,y); ctx.lineTo(x-1,y-0.5); }
        }
      }
      ctx.stroke();
    }
    // field arrows
    const G=arrows;
    ctx.strokeStyle="#fff"; ctx.lineWidth=1.5;
    for(let gy=0;gy<G;gy++) for(let gx=0;gx<G;gx++){
      const x=(gx+0.5)/G, y=(gy+0.5)/G;
      const [Ex,Ey]=field(x,y,charges);
      const s=0.015; const px=x*W, py=(1-y)*H;
      const nx=px + s*Ex*W, ny=py - s*Ey*H;
      ctx.beginPath(); ctx.moveTo(px,py); ctx.lineTo(nx,ny); ctx.stroke();
    }
    // draw charges
    for(const c0 of charges){
      ctx.beginPath();
      ctx.arc(c0.x*W, (1-c0.y)*H, 8, 0, Math.PI*2);
      ctx.fillStyle = c0.q>0 ? "#ff7a7a" : "#79b6ff";
      ctx.fill();
    }
  },[W,H,charges,arrows,levels]);

  // drag charges
  useEffect(()=>{
    const c=cnv.current; if(!c) return;
    let drag=-1;
    const down=e=>{
      const r=c.getBoundingClientRect(); const x=(e.clientX-r.left)/r.width, y=1-(e.clientY-r.top)/r.height;
      drag = chargesRef.current.findIndex(q=> (q.x-x)**2 + (q.y-y)**2 < (12/W)*(12/W)*4 );
    };
    const move=e=>{
      if(drag<0) return;
      const r=c.getBoundingClientRect(); const x=(e.clientX-r.left)/r.width, y=1-(e.clientY-r.top)/r.height;
      setCharges(cs=> cs.map((q,i)=> i===drag ? {...q, x:Math.min(0.98,Math.max(0.02,x)), y:Math.min(0.98,Math.max(0.02,y))} : q));
    };
    const up=()=>{ drag=-1; };
    c.addEventListener("mousedown",down); window.addEventListener("mousemove",move); window.addEventListener("mouseup",up);
    return ()=>{ c.removeEventListener("mousedown",down); window.removeEventListener("mousemove",move); window.removeEventListener("mouseup",up); };
  },[W]);

  const flip = (i)=> setCharges(cs=> cs.map((q,k)=> k===i? {...q, q: -q.q } : q));
  const add = (sign)=> setCharges(cs=> cs.concat([{x:0.5+0.02*(cs.length%3), y:0.5, q: sign}]));
  const remove = (i)=> setCharges(cs=> cs.filter((_,k)=> k!==i));

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">Complex Potentials — Charges, Field & Equipotentials</h2>
      <canvas ref={cnv} style={{width:"100%", imageRendering:"pixelated"}}/>
      <div className="grid" style={{gridTemplateColumns:"1fr 360px", gap:16}}>
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <h3 className="font-semibold mb-2">Charges</h3>
          {charges.map((c,i)=>(
            <div key={i} className="flex items-center gap-2 text-sm mb-1">
              <span>#{i}</span>
              <span>{c.q>0?"+":"−"}</span>
              <button className="px-2 py-1 rounded bg-white/10 border border-white/10" onClick={()=>flip(i)}>flip</button>
              <button className="px-2 py-1 rounded bg-white/10 border border-white/10" onClick={()=>remove(i)}>remove</button>
            </div>
          ))}
          <div className="flex gap-2 mt-2">
            <button className="px-2 py-1 rounded bg-white/10 border border-white/10" onClick={()=>add(+1)}>+ add</button>
            <button className="px-2 py-1 rounded bg-white/10 border border-white/10" onClick={()=>add(-1)}>− add</button>
          </div>
        </section>
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <Slider label="field arrows" v={arrows} set={setArrows} min={8} max={40} step={1}/>
          <Slider label="equipotential levels" v={levels} set={setLevels} min={6} max={30} step={1}/>
          <ActiveReflection
            title="Active Reflection — Potentials"
            storageKey="reflect_potentials"
            prompts={[
              "Drag charges: where do field lines start/stop?",
              "Flip a charge: how do equipotentials rearrange?",
              "What happens to φ near a charge (log behavior in 2D)?"
            ]}
          />
        </section>
      </div>
    </div>
  );
}
function Slider({label,v,set,min,max,step}){ const show=(typeof v==='number'&&v.toFixed)?v.toFixed(2):v;
  return (<div className="mb-2"><label className="text-sm opacity-80">{label}: <b>{show}</b></label>
  <input className="w-full" type="range" min={min} max={max} step={step}
    value={v} onChange={e=>set(parseFloat(e.target.value))}/></div>);
}
