import { useMemo, useState } from "react";

/* -------- helpers -------- */
function sieve(n){
  const isPrime = Array(n+1).fill(true);
  isPrime[0]=isPrime[1]=false;
  for(let p=2;p*p<=n;p++){
    if(isPrime[p]){
      for(let k=p*p;k<=n;k+=p) isPrime[k]=false;
    }
  }
  const primes=[];
  for(let i=2;i<=n;i++) if(isPrime[i]) primes.push(i);
  return primes;
}
function gaps(primes){
  const gs=[];
  for(let i=1;i<primes.length;i++) gs.push(primes[i]-primes[i-1]);
  return gs;
}

export default function PrimeGapsLab(){
  const [limit,setLimit]=useState(20000);
  const [bins,setBins]=useState(60);

  const {pr, gp, maxGap, hist} = useMemo(()=>{
    const pr = sieve(limit);
    const gp = gaps(pr);
    const maxGap = gp.length? Math.max(...gp) : 0;

    // histogram up to a reasonable max
    const gMax = Math.max(10, Math.min(maxGap, 200));
    const H = Array(bins).fill(0);
    for(const g of gp){
      const idx = Math.min(bins-1, Math.floor((g/gMax)*bins));
      H[idx]+=1;
    }
    const total = H.reduce((a,b)=>a+b,0)||1;
    const hist = H.map(x=>x/total);
    return {pr, gp, maxGap, hist, gMax};
  },[limit,bins]);

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">Prime Gaps Explorer</h2>
      <Controls label="limit" v={limit} set={setLimit} min={1000} max={200000} step={1000}/>
      <Controls label="bins" v={bins} set={setBins} min={20} max={120} step={5}/>
      <div className="grid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:16}}>
        <Panel title={`Primes ≤ ${limit} (count=${pr.length})`}>
          <SmallText text={pr.slice(0,64).join(", ") + (pr.length>64?" …":"")}/>
        </Panel>
        <Panel title={`Gap histogram (max gap ≈ ${maxGap})`}>
          <Hist hist={hist}/>
        </Panel>
        <Panel title="Max gap vs index">
          <MaxGapPlot gp={gp}/>
        </Panel>
      </div>
      <p className="text-sm opacity-80">
        Observe average gap ~ log n, but local gaps fluctuate wildly; large gaps appear near big n.
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
function Panel({title,children}){
  return <section className="p-3 rounded-lg bg-white/5 border border-white/10">
    <h3 className="font-semibold mb-2">{title}</h3>{children}
  </section>;
}
function SmallText({text}){ return <div className="text-xs break-words">{text}</div>; }

function Hist({hist}){
  const W=320,H=140,pad=8;
  const n=hist.length;
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
      <rect x="0" y="0" width={W} height={H} fill="none"/>
      {hist.map((v,i)=>{
        const x=pad + i*((W-2*pad)/n), w=(W-2*pad)/n*0.95, h=(H-2*pad)*v;
        return <rect key={i} x={x} y={H-pad-h} width={w} height={h} rx="2" ry="2"/>;
      })}
    </svg>
  );
}
function MaxGapPlot({gp}){
  const W=320,H=140,pad=10;
  let max=0;
  const xs=[], ys=[];
  for(let i=0;i<gp.length;i++){
    if(gp[i]>max) max=gp[i];
    xs.push(i);
    ys.push(max);
  }
  const X=i=> pad + (i/Math.max(1,gp.length-1))*(W-2*pad);
  const Y=y=> H-pad - (y/Math.max(1,Math.max(...ys)))*(H-2*pad);
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
      <rect x="0" y="0" width={W} height={H} fill="none"/>
      {ys.map((y,i)=>{
        const x1=i?X(i-1):X(i), y1=i?Y(ys[i-1]):Y(y), x2=X(i), y2=Y(y);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth="2"/>;
      })}
    </svg>
  );
}
