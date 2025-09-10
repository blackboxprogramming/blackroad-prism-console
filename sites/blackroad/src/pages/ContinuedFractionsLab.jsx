import { useMemo, useState } from "react";

function cfrac(x, maxK=12){
  // simple continued fraction expansion
  const a=[]; let y=x;
  for(let k=0;k<maxK;k++){
    const ak = Math.floor(y);
    a.push(ak);
    const frac = y-ak;
    if(frac < 1e-12) break;
    y = 1/frac;
  }
  return a;
}
function convergents(a){
  // build p/q from continued fraction coefficients
  const res=[];
  let p0=1, q0=0, p1=a[0], q1=1;
  res.push({p:p1,q:q1});
  for(let k=1;k<a.length;k++){
    const ak = a[k];
    const p = ak*p1 + p0;
    const q = ak*q1 + q0;
    res.push({p,q});
    p0=p1; q0=q1; p1=p; q1=q;
  }
  return res;
}

export default function ContinuedFractionsLab(){
  const [val,setVal] = useState(Math.PI);
  const [maxK,setMaxK] = useState(12);

  const a = useMemo(()=>cfrac(val, maxK),[val,maxK]);
  const conv = useMemo(()=>convergents(a),[a]);

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">Continued Fractions — Best Rational Approximations</h2>
      <div className="grid" style={{gridTemplateColumns:"1fr 320px", gap:16}}>
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <table className="w-full text-sm">
            <thead><tr className="opacity-80">
              <th className="text-left">k</th><th className="text-left">p/q</th><th className="text-left">value</th><th className="text-left">|x−p/q|</th>
            </tr></thead>
            <tbody>
              {conv.map((c,i)=>{
                const valpq = c.p/c.q;
                const err = Math.abs(val - valpq);
                return (
                  <tr key={i}>
                    <td>{i}</td>
                    <td>{c.p}/{c.q}</td>
                    <td>{valpq.toPrecision(10)}</td>
                    <td>{err.toExponential(3)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <h3 className="font-semibold mb-2">Controls</h3>
          <Num label="x" v={val} set={setVal}/>
          <Slider label="max terms" v={maxK} set={setMaxK} min={3} max={24} step={1}/>
          <p className="text-sm opacity-80 mt-2">
            Try φ≈1.61803398875 or √2≈1.41421356237 or π≈3.1415926535.
          </p>
        </section>
      </div>
    </div>
  );
}

function Num({label,v,set}){
  return (
    <div className="mb-2">
      <label className="text-sm opacity-80">{label}: </label>
      <input className="w-full p-2 rounded bg-white/10 border border-white/10"
             type="text" value={v}
             onChange={e=>set(parseFloat(e.target.value)||0)} />
    </div>
  );
}
function Slider({label,v,set,min,max,step}){
  return (
    <div className="mb-2">
      <label className="text-sm opacity-80">{label}: <b>{v}</b></label>
      <input className="w-full" type="range" min={min} max={max} step={step}
             value={v} onChange={e=>set(parseInt(e.target.value))}/>
    </div>
  );
}
