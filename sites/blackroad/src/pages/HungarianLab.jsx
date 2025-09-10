import { useMemo, useState } from "react";
import ActiveReflection from "./ActiveReflection.jsx";

export default function HungarianLab(){
  const [n,setN]=useState(5);
  const [seed,setSeed]=useState(7);
  const [scale,setScale]=useState(9); // cost magnitude
  const C = useMemo(()=>makeCost(n,seed,scale),[n,seed,scale]);
  const {assign, cost} = useMemo(()=>hungarian(C),[C]);

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">Hungarian Assignment — optimal matching</h2>
      <Matrix cost={C} assign={assign}/>
      <div className="grid" style={{gridTemplateColumns:'1fr 320px', gap:16}}>
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <Slider label="n" v={n} set={setN} min={2} max={10} step={1}/>
          <Slider label="seed" v={seed} set={setSeed} min={1} max={9999} step={1}/>
          <Slider label="cost scale" v={scale} set={setScale} min={5} max={20} step={1}/>
          <p className="text-sm mt-2">Total cost = <b>{cost.toFixed(2)}</b></p>
        </section>
        <ActiveReflection
          title="Active Reflection — Hungarian"
          storageKey="reflect_hungarian"
          prompts={[
            "Row/col reductions: which zeros emerge and why?",
            "When do multiple optimal matchings appear?",
            "How does scaling the costs affect stability of the chosen edges?"
          ]}
        />
      </div>
    </div>
  );
}

function rng(seed){ let s=seed|0||2025; return ()=> (s=(1664525*s+1013904223)>>>0)/2**32; }
function makeCost(n,seed,scale){
  const r=rng(seed);
  return Array.from({length:n},()=>Array.from({length:n},()=> +(scale*r()).toFixed(2)));
}

// Hungarian for small n, cost matrix
function hungarian(A){
  const n=A.length;
  const a = A.map(row=>row.slice());
  // step 1: row reduce
  for(let i=0;i<n;i++){ const m=Math.min(...a[i]); for(let j=0;j<n;j++) a[i][j]-=m; }
  // step 2: col reduce
  for(let j=0;j<n;j++){ let m=Infinity; for(let i=0;i<n;i++) m=Math.min(m,a[i][j]); for(let i=0;i<n;i++) a[i][j]-=m; }

  let coverRow=Array(n).fill(false), coverCol=Array(n).fill(false);
  let star=Array.from({length:n},()=>Array(n).fill(false));
  let prime=Array.from({length:n},()=>Array(n).fill(false));

  // star independent zeros greedily
  for(let i=0;i<n;i++){
    for(let j=0;j<n;j++){
      if(a[i][j]===0 && !star[i].some(v=>v) && !coverCol[j]){
        star[i][j]=true; coverCol[j]=true; break;
      }
    }
  }
  coverCol=Array(n).fill(false);
  // main loop
  while(true){
    // cover columns containing a starred zero
    for(let j=0;j<n;j++) coverCol[j]=false;
    for(let i=0;i<n;i++) for(let j=0;j<n;j++) if(star[i][j]) coverCol[j]=true;
    const coveredCols = coverCol.reduce((s,v)=>s+(v?1:0),0);
    if(coveredCols===n) break; // optimal

    // find a noncovered zero and prime it; if no star in its row, augment; else cover row, uncover that col, repeat
    let z=null;
    while(true){
      z=findZero(a,coverRow,coverCol);
      if(!z){
        // adjust matrix: add min uncovered to all covered rows and subtract from uncovered cols
        const m = minUncovered(a,coverRow,coverCol);
        for(let i=0;i<n;i++) for(let j=0;j<n;j++){
          if(coverRow[i]) a[i][j]+=m;
          if(!coverCol[j]) a[i][j]-=m;
        }
      }else{
        const [i,j]=z;
        prime[i][j]=true;
        const starCol = star[i].findIndex(v=>v);
        if(starCol===-1){
          // augment path
          augment(star, prime, i, j);
          prime=Array.from({length:n},()=>Array(n).fill(false));
          coverRow=Array(n).fill(false); coverCol=Array(n).fill(false);
          break;
        }else{
          coverRow[i]=true; coverCol[starCol]=false;
        }
      }
    }
  }
  // build assignment
  const assign=Array(n).fill(-1);
  for(let i=0;i<n;i++) for(let j=0;j<n;j++) if(star[i][j]) assign[i]=j;
  let cost=0; for(let i=0;i<n;i++) cost+=A[i][assign[i]];
  return {assign, cost};
}
function findZero(a,coverRow,coverCol){
  for(let i=0;i<a.length;i++) if(!coverRow[i]) for(let j=0;j<a.length;j++) if(!coverCol[j] && a[i][j]===0) return [i,j];
  return null;
}
function minUncovered(a,coverRow,coverCol){
  let m=Infinity;
  for(let i=0;i<a.length;i++) if(!coverRow[i]) for(let j=0;j<a.length;j++) if(!coverCol[j]) m=Math.min(m,a[i][j]);
  return m;
}
function augment(star, prime, r,c){
  // build alternating path starting at (r,c)
  let path=[[r,c]];
  while(true){
    const j = path[path.length-1][1];
    const iStar = star.findIndex(row=>row[j]);
    if(iStar===-1) break;
    path.push([iStar,j]);
    const jPrime = prime[iStar].findIndex(v=>v);
    path.push([iStar,jPrime]);
  }
  for(const [i,j] of path){
    if(star[i][j]) star[i][j]=false; else star[i][j]=true;
  }
}
function Matrix({cost,assign}){
  const n=cost.length, W=640, H=40*n+30, pad=10, cellW=(W-2*pad)/n, cellH=40;
  return (
    <section className="p-3 rounded-lg bg-white/5 border border-white/10">
      <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
        {cost.map((row,i)=> row.map((v,j)=>{
          const x=pad + j*cellW, y=pad + i*cellH;
          const chosen = assign[i]===j;
          return (
            <g key={`${i}-${j}`}>
              <rect x={x} y={y} width={cellW-2} height={cellH-2} rx="6" ry="6"/>
              <text x={x+8} y={y+24} fontSize="12">{v.toFixed(2)}</text>
              {chosen && <text x={x+cellW-18} y={y+22} fontSize="12">★</text>}
            </g>
          );
        }))}
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
