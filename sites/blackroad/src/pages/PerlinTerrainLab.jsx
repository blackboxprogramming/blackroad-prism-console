import { useEffect, useMemo, useRef, useState } from "react";
import ActiveReflection from "./ActiveReflection.jsx";

function rng(seed){ let s=seed|0||1; return ()=> (s=(1664525*s+1013904223)>>>0)/2**32; }
function grad2(r){ const a=2*Math.PI*r(); return [Math.cos(a), Math.sin(a)]; }
function dot(a,b,x,y){ return (x-a[0])*b[0] + (y-a[1])*b[1]; }
function fade(t){ return t*t*t*(t*(t*6-15)+10); }

function perlin2(x,y, G){
  const xi=Math.floor(x), yi=Math.floor(y);
  const xf=x-xi, yf=y-yi;
  const g00=G.get(`${xi},${yi}`), g10=G.get(`${xi+1},${yi}`),
        g01=G.get(`${xi},${yi+1}`), g11=G.get(`${xi+1},${yi+1}`);
  const d00=g00[0]*xf       + g00[1]*yf;
  const d10=g10[0]*(xf-1)   + g10[1]*yf;
  const d01=g01[0]*xf       + g01[1]*(yf-1);
  const d11=g11[0]*(xf-1)   + g11[1]*(yf-1);
  const u=fade(xf), v=fade(yf);
  const x1=d00 + u*(d10-d00), x2=d01 + u*(d11-d01);
  return x1 + v*(x2-x1);
}
function fbm(x,y, oct, lac, gain, G){
  let f=1, a=1, sum=0, norm=0;
  for(let o=0;o<oct;o++){
    sum += a*perlin2(x*f,y*f,G); norm += a; f*=lac; a*=gain;
  }
  return sum/(norm||1);
}

export default function PerlinTerrainLab(){
  const [N,setN]=useState(256);
  const [oct,setOct]=useState(5);
  const [lac,setLac]=useState(2.0);
  const [gain,setGain]=useState(0.5);
  const [seed,setSeed]=useState(42);
  const [contours,setContours]=useState(8);

  const grad = useMemo(()=>{
    const r=rng(seed); const G=new Map();
    for(let y=-1;y<=N+1;y++) for(let x=-1;x<=N+1;x++) G.set(`${x},${y}`, grad2(r));
    return G;
  },[N,seed]);

  const cnv=useRef(null);
  useEffect(()=>{
    const c=cnv.current; if(!c) return; c.width=N; c.height=N;
    const ctx=c.getContext("2d",{alpha:false});
    const img=ctx.createImageData(N,N);
    // heightfield
    let mn=Infinity, mx=-Infinity; const Z=new Float32Array(N*N);
    for(let y=0;y<N;y++) for(let x=0;x<N;x++){
      const z=fbm(x/N, y/N, oct, lac, gain, grad);
      Z[y*N+x]=z; if(z<mn) mn=z; if(z>mx) mx=z;
    }
    // color + contours
    for(let y=0;y<N;y++) for(let x=0;x<N;x++){
      const z=(Z[y*N+x]-mn)/(mx-mn+1e-9);
      const shade = Math.pow(z, 1.2);
      const off=4*(y*N+x);
      img.data[off]=Math.floor(40+200*shade);
      img.data[off+1]=Math.floor(50+180*(1-shade));
      img.data[off+2]=Math.floor(220*(1-shade));
      img.data[off+3]=255;
      if(contours>0){
        const level = Math.floor(z*contours);
        const eps = 1/Math.max(8, contours*8);
        const nz = (Z[y*N+Math.min(N-1,x+1)]-mn)/(mx-mn+1e-9);
        if(Math.floor(nz*contours)!==level && Math.abs(nz-z)>eps){
          img.data[off]=255; img.data[off+1]=255; img.data[off+2]=255;
        }
      }
    }
    ctx.putImageData(img,0,0);
  },[N,oct,lac,gain,grad,contours]);

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">Perlin Terrain — fBm heightfield</h2>
      <canvas ref={cnv} style={{width:"100%", imageRendering:"pixelated"}}/>
      <div className="grid" style={{gridTemplateColumns:"1fr 320px", gap:16}}>
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <Slider label="grid N" v={N} set={setN} min={128} max={384} step={32}/>
          <Slider label="octaves" v={oct} set={setOct} min={1} max={8} step={1}/>
          <Slider label="lacunarity" v={lac} set={setLac} min={1.5} max={3.5} step={0.1}/>
          <Slider label="gain" v={gain} set={setGain} min={0.3} max={0.8} step={0.01}/>
          <Slider label="contours" v={contours} set={setContours} min={0} max={20} step={1}/>
          <Slider label="seed" v={seed} set={setSeed} min={1} max={9999} step={1}/>
        </section>
        <ActiveReflection
          title="Active Reflection — Perlin Terrain"
          storageKey="reflect_perlin"
          prompts={[
            "Increase lacunarity: frequencies spread — what happens to texture?",
            "Lower gain: high-octave contribution shrinks — which features fade?",
            "Try different seeds: which global structure persists?"
          ]}
        />
      </div>
    </div>
  );
}
function Slider({label,v,set,min,max,step}){ const show=(typeof v==='number'&&v.toFixed)?v.toFixed(2):v;
  return (<div className="mb-2"><label className="text-sm opacity-80">{label}: <b>{show}</b></label>
  <input className="w-full" type="range" min={min} max={max} step={step}
  value={v} onChange={e=>set(parseFloat(e.target.value))}/></div>);
}

