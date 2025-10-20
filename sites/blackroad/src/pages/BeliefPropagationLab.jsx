import { useMemo, useState } from "react";
import ActiveReflection from "./ActiveReflection.jsx";

/** Graph: A—B—C—D, binary variables.
 *  Pairwise factors ψ(A,B), ψ(B,C), ψ(C,D) prefer equality with strength alpha.
 *  Local priors φ(X) bias toward 1 with bias betaX.
 *  We run a fixed number of sum-product iterations and show marginals.
 */
function normalize(v){ const s=v.reduce((a,b)=>a+b,0)||1; return v.map(x=>x/s); }

export default function BeliefPropagationLab(){
  const [alpha,setAlpha]=useState(2.0);     // pairwise strength (== preference)
  const [betaA,setBetaA]=useState(0.2);
  const [betaB,setBetaB]=useState(0.0);
  const [betaC,setBetaC]=useState(-0.1);
  const [betaD,setBetaD]=useState(0.6);
  const [iters,setIters]=useState(12);

  const result = useMemo(()=> runBP({alpha, betas:[betaA,betaB,betaC,betaD], iters}), [alpha,betaA,betaB,betaC,betaD,iters]);

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">Belief Propagation — tiny factor graph</h2>
      <Marginals m={result.m}/>
      <div className="grid" style={{gridTemplateColumns:"1fr 320px", gap:16}}>
        <MsgSnap shots={result.shots}/>
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <Slider label="pairwise α (equal-prefer)" v={alpha} set={setAlpha} min={-2.0} max={4.0} step={0.1}/>
          <Slider label="β_A" v={betaA} set={setBetaA} min={-1} max={1} step={0.05}/>
          <Slider label="β_B" v={betaB} set={setBetaB} min={-1} max={1} step={0.05}/>
          <Slider label="β_C" v={betaC} set={setBetaC} min={-1} max={1} step={0.05}/>
          <Slider label="β_D" v={betaD} set={setBetaD} min={-1} max={1} step={0.05}/>
          <Slider label="iterations" v={iters} set={setIters} min={1} max={50} step={1}/>
          <ActiveReflection
            title="Active Reflection — Belief Prop"
            storageKey="reflect_bp"
            prompts={[
              "Raise α: do neighbors align more strongly (marginals move toward 00/11)?",
              "Flip β_A and β_D to opposite signs: where does the ‘tension’ settle?",
              "Increase iterations: how fast do beliefs stabilize on this simple chain?"
            ]}
          />
        </section>
      </div>
    </div>
  );
}

function phi(beta){ // prior φ(x) ∝ exp(beta * x), x∈{0,1}
  return normalize([ Math.exp(beta*0), Math.exp(beta*1) ]);
}
function psi(alpha){ // pairwise ψ(x,y) ∝ exp( alpha * [x==y] )
  // table: x,y in {0,1}
  const e= Math.exp(alpha), o= Math.exp(0);
  return [ [e, o], [o, e] ];
}
function runBP({alpha, betas, iters}){
  const vars=4;
  const prior = betas.map(phi);
  const pair = psi(alpha);

  // messages m_{i->j} as arrays [p0,p1]; initialize uniform
  const msg = {
    "A->B":[0.5,0.5], "B->A":[0.5,0.5],
    "B->C":[0.5,0.5], "C->B":[0.5,0.5],
    "C->D":[0.5,0.5], "D->C":[0.5,0.5],
  };
  const shots=[];

  for(let t=0;t<iters;t++){
    // update in chain order (sum-product)
    // A->B
    msg["A->B"] = normalize(sumProd(prior[0], [], pair));
    // B->A
    msg["B->A"] = normalize(sumProd(prior[1], [msg["C->B"]], pair));
    // B->C
    msg["B->C"] = normalize(sumProd(prior[1], [msg["A->B"]], pair));
    // C->B
    msg["C->B"] = normalize(sumProd(prior[2], [msg["D->C"]], pair));
    // C->D
    msg["C->D"] = normalize(sumProd(prior[2], [msg["B->C"]], pair));
    // D->C
    msg["D->C"] = normalize(sumProd(prior[3], [], pair));

    // snapshot marginals
    shots.push({
      t,
      A: marginal(prior[0], [msg["B->A"]]),
      B: marginal(prior[1], [msg["A->B"], msg["C->B"]]),
      C: marginal(prior[2], [msg["B->C"], msg["D->C"]]),
      D: marginal(prior[3], [msg["C->D"]]),
    });
  }

  const m = shots[shots.length-1];
  return {m, shots};
}

function sumProd(phi_i, incomingMsgs, psi){
  const res=[0,0];
  for(let y=0;y<2;y++){
    let acc=0;
    for(let x=0;x<2;x++){
      const psi_xy = psi[x][y];
      const prod = incomingMsgs.reduce((p,msg)=>p*msg[x], phi_i[x]);
      acc += prod * psi_xy;
    }
    res[y]=acc;
  }
  return res;
}
function marginal(phi_i, incoming){
  let v = phi_i.slice();
  for(const m of incoming){ v=[ v[0]*m[0], v[1]*m[1] ]; }
  return normalize(v);
}

function Marginals({m}){
  const labs=["A","B","C","D"]; const vals=[m.A,m.B,m.C,m.D];
  return (
    <section className="p-3 rounded-lg bg-white/5 border border-white/10">
      <h3 className="font-semibold mb-2">Final marginals P(X=1)</h3>
      <svg width="100%" viewBox="0 0 640 160">
        {vals.map((p,i)=>{
          const v=p[1]; const x=20 + i*150, w=120, h=120;
          const barH = v*h;
          return (
            <g key={i} transform={`translate(${x},20)`}>
              <rect x="0" y={h-barH} width={w} height={barH} rx="4" ry="4"/>
              <text x={w/2} y={h+14} textAnchor="middle" fontSize="12">{labs[i]} — {v.toFixed(3)}</text>
            </g>
          );
        })}
      </svg>
    </section>
  );
}
function MsgSnap({shots}){
  const last = shots[shots.length-1];
  if(!last) return null;
  const rows = [
    ["A", last.A], ["B", last.B], ["C", last.C], ["D", last.D]
  ];
  return (
    <section className="p-3 rounded-lg bg-white/5 border border-white/10">
      <h3 className="font-semibold mb-2">Snapshot (last iter)</h3>
      <table className="text-sm w-full">
        <thead><tr><th className="text-left">Var</th><th className="text-left">P(0)</th><th className="text-left">P(1)</th></tr></thead>
        <tbody>
          {rows.map(([k,v],i)=><tr key={i}><td>{k}</td><td>{v[0].toFixed(3)}</td><td>{v[1].toFixed(3)}</td></tr>)}
        </tbody>
      </table>
    </section>
  );
}
function Slider({label,v,set,min,max,step}){
  const show=(typeof v==="number"&&v.toFixed)?v.toFixed(3):v;
  return (<div className="mb-2"><label className="text-sm opacity-80">{label}: <b>{show}</b></label>
    <input className="w-full" type="range" min={min} max={max} step={step}
      value={v} onChange={e=>set(parseFloat(e.target.value))}/></div>);
}
