import { useMemo, useState } from "react";
import ActiveReflection from "./ActiveReflection.jsx";

// Dual numbers: (a + b ε), with ε^2=0
class Dual {
  constructor(re, eps=0){ this.re=re; this.eps=eps; }
  static of(x){ return new Dual(x,0); }
}
const add=(x,y)=> new Dual(x.re+y.re, x.eps+y.eps);
const sub=(x,y)=> new Dual(x.re-y.re, x.eps-y.eps);
const mul=(x,y)=> new Dual(x.re*y.re, x.re*y.eps + x.eps*y.re);
const divd=(x,y)=> {
  const den = y.re*y.re;
  return new Dual(x.re/y.re, (x.eps*y.re - x.re*y.eps)/den);
};
const sin=(x)=> new Dual(Math.sin(x.re), Math.cos(x.re)*x.eps);
const cos=(x)=> new Dual(Math.cos(x.re), -Math.sin(x.re)*x.eps);
const exp=(x)=> { const e=Math.exp(x.re); return new Dual(e, e*x.eps); }
const log=(x)=> new Dual(Math.log(x.re), x.eps/x.re);
const pow=(x,p)=> { const r = Math.pow(x.re,p); return new Dual(r, p*Math.pow(x.re,p-1)*x.eps); };

function f_expr(x){
  // editable: f(x) = e^{sin x} + x^3 - 2 log x
  return add( exp(sin(x)), sub(pow(x,3), mul(new Dual(2), log(x))) );
}

export default function AutoDiffLab(){
  const [x,setX]=useState(1.3);
  const [h,setH]=useState(1e-5);
  const dual = useMemo(()=>{
    const xdual = new Dual(x, 1); // seed derivative = 1
    const y = f_expr(xdual);
    return {y: y.re, dy: y.eps};
  },[x]);

  const fd = useMemo(()=>{
    const y1 = f_expr(new Dual(x+h,0)).re;
    const y0 = f_expr(new Dual(x-h,0)).re;
    return (y1 - y0)/(2*h);
  },[x,h]);

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">Automatic Differentiation — Dual & Finite Diff</h2>
      <div className="grid" style={{gridTemplateColumns:'1fr 320px', gap:16}}>
        <Panel title="Function">
          <p className="text-sm opacity-80">f(x) = e^{sin(x)} + x^3 − 2 log(x)</p>
          <p className="text-sm">x = <b>{x.toFixed(6)}</b></p>
          <p className="text-sm">f(x) = <b>{dual.y.toFixed(6)}</b></p>
          <p className="text-sm">f′(x) via dual = <b>{dual.dy.toFixed(6)}</b></p>
          <p className="text-sm">f′(x) via central diff = <b>{fd.toFixed(6)}</b></p>
          <p className="text-xs opacity-70">They should match closely; try varying h.</p>
        </Panel>
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <Slider label="x" v={x} set={setX} min={0.2} max={2.5} step={0.001}/>
          <Slider label="h (finite diff)" v={h} set={setH} min={1e-7} max={1e-2} step={1e-7}/>
          <ActiveReflection
            title="Active Reflection — AD"
            storageKey="reflect_autodiff"
            prompts={[
              "Change h: when do rounding errors dominate central differences?",
              "Edit f_expr to include products/exp/sin/log — does dual derivative stay exact?",
              "Why does dual auto-diff give machine-precision derivatives in 1 pass?"
            ]}
          />
        </section>
      </div>
    </div>
  );
}
function Panel({title,children}){ return <section className="p-3 rounded-lg bg-white/5 border border-white/10"><h3 className="font-semibold mb-2">{title}</h3>{children}</section>; }
function Slider({label,v,set,min,max,step}){
  const show=(typeof v==='number'&&v.toFixed)?v.toFixed(7):v;
  return (<div className="mb-2"><label className="text-sm opacity-80">{label}: <b>{show}</b></label>
  <input className="w-full" type="range" min={min} max={max} step={step}
         value={v} onChange={e=>set(parseFloat(e.target.value))}/></div>);
}
