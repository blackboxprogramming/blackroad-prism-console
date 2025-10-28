import { useEffect, useMemo, useRef, useState } from 'react';
import ActiveReflection from './ActiveReflection.jsx';
import { useEffect, useMemo, useRef, useState } from "react";
import ActiveReflection from "./ActiveReflection.jsx";

/** Solve ∇²ψ = κ² sinh(ψ) with Dirichlet patches (painted electrodes).
 *  Picard–Gauss–Seidel: ψ←avg(neigh) − (h² κ² /4) sinh(ψ_old).
 */
export default function PoissonBoltzmannLab() {
  const [N, setN] = useState(160);
  const [kappa, setKappa] = useState(1.2);
  const [sweeps, setSweeps] = useState(40);
  const [mode, setMode] = useState('paint'); // paint | erase
  const [volts, setVolts] = useState(1.0);
  const [arrows, setArrows] = useState(18);

  const cnv = useRef(null);
  const sim = useMemo(() => makeSim(N), [N]);

  // painting electrodes
  useEffect(() => {
    const c = cnv.current;
    if (!c) return;
    c.width = N;
    c.height = N;
    const r = () => c.getBoundingClientRect();
    let down = false;
    const P = (e) => ({
      x: Math.max(
        0,
        Math.min(N - 1, Math.floor(((e.clientX - r().left) / r().width) * N))
      ),
      y: Math.max(
        0,
        Math.min(N - 1, Math.floor(((e.clientY - r().top) / r().height) * N))
      ),
    });
    const paint = (x, y) => {
      const R = 4;
      for (let j = -R; j <= R; j++)
        for (let i = -R; i <= R; i++) {
          const X = Math.max(1, Math.min(N - 2, x + i)),
            Y = Math.max(1, Math.min(N - 2, y + j));
          if (i * i + j * j <= R * R) {
            if (mode === 'paint') {
              sim.mask[Y][X] = true;
              sim.psi[Y][X] = volts;
            } else {
              sim.mask[Y][X] = false;
            }
          }
        }
    };
    const md = (e) => {
      down = true;
      const p = P(e);
      paint(p.x, p.y);
    };
    const mv = (e) => {
      if (down) {
        const p = P(e);
        paint(p.x, p.y);
      }
    };
    const mu = () => {
      down = false;
    };
    c.addEventListener('mousedown', md);
    window.addEventListener('mousemove', mv);
    window.addEventListener('mouseup', mu);
    return () => {
      c.removeEventListener('mousedown', md);
      window.removeEventListener('mousemove', mv);
      window.removeEventListener('mouseup', mu);
    };
  }, [sim, mode, volts, N]);

  // solve + render loop
  useEffect(() => {
    const c = cnv.current;
    if (!c) return;
    const ctx = c.getContext('2d', { alpha: false });
    let raf;
    const loop = () => {
      solve(sim, kappa, sweeps);
      render(ctx, sim, arrows);
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, [sim, kappa, sweeps, arrows]);

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">
        Poisson–Boltzmann — Nonlinear Electrostatics
      </h2>
      <canvas
        ref={cnv}
        style={{ width: '100%', imageRendering: 'pixelated' }}
      />
      <div
        className="grid"
        style={{ gridTemplateColumns: '1fr 360px', gap: 16 }}
      >
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <button
            className="px-3 py-1 rounded bg-white/10 border border-white/10"
            onClick={() => reset(sim)}
          >
            Reset
          </button>
          <div className="mt-2 text-sm flex gap-3">
            <label>
              <input
                type="radio"
                checked={mode === 'paint'}
                onChange={() => setMode('paint')}
              />{' '}
              paint
            </label>
            <label>
              <input
                type="radio"
                checked={mode === 'erase'}
                onChange={() => setMode('erase')}
              />{' '}
              erase
            </label>
          </div>
        </section>
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <Slider
            label="paint ψ"
            v={volts}
            set={setVolts}
            min={-2}
            max={2}
            step={0.05}
          />
          <Slider
            label="κ (salt strength)"
            v={kappa}
            set={setKappa}
            min={0.2}
            max={2.4}
            step={0.05}
          />
          <Slider
            label="sweeps/frame"
            v={sweeps}
            set={setSweeps}
            min={5}
            max={120}
            step={5}
          />
          <Slider
            label="field arrows"
            v={arrows}
            set={setArrows}
            min={8}
            max={32}
            step={1}
          />
          <Slider
            label="grid N"
            v={N}
            set={setN}
            min={96}
            max={224}
            step={16}
          />
export default function PoissonBoltzmannLab(){
  const [N,setN]=useState(160);
  const [kappa,setKappa]=useState(1.2);
  const [sweeps,setSweeps]=useState(40);
  const [mode,setMode]=useState("paint"); // paint | erase
  const [volts,setVolts]=useState(1.0);
  const [arrows,setArrows]=useState(18);

  const cnv=useRef(null);
  const sim=useMemo(()=> makeSim(N),[N]);

  // painting electrodes
  useEffect(()=>{
    const c=cnv.current; if(!c) return; c.width=N; c.height=N;
    const r=()=>c.getBoundingClientRect();
    let down=false;
    const P=(e)=>({x:Math.max(0,Math.min(N-1,Math.floor((e.clientX-r().left)/r().width*N))),
                   y:Math.max(0,Math.min(N-1,Math.floor((e.clientY-r().top )/r().height*N)))});
    const paint=(x,y)=>{
      const R=4;
      for(let j=-R;j<=R;j++) for(let i=-R;i<=R;i++){
        const X=Math.max(1,Math.min(N-2,x+i)), Y=Math.max(1,Math.min(N-2,y+j));
        if(i*i+j*j<=R*R){
          if(mode==="paint"){ sim.mask[Y][X]=true; sim.psi[Y][X]=volts; }
          else { sim.mask[Y][X]=false; }
        }
      }
    };
    const md=(e)=>{ down=true; const p=P(e); paint(p.x,p.y); };
    const mv=(e)=>{ if(down){ const p=P(e); paint(p.x,p.y); } };
    const mu=()=>{ down=false; };
    c.addEventListener("mousedown",md);
    window.addEventListener("mousemove",mv);
    window.addEventListener("mouseup",mu);
    return ()=>{ c.removeEventListener("mousedown",md); window.removeEventListener("mousemove",mv); window.removeEventListener("mouseup",mu); };
  },[sim,mode,volts,N]);

  // solve + render loop
  useEffect(()=>{
    const c=cnv.current; if(!c) return; const ctx=c.getContext("2d",{alpha:false});
    let raf;
    const loop=()=>{
      solve(sim, kappa, sweeps);
      render(ctx, sim, arrows);
      raf=requestAnimationFrame(loop);
    };
    loop(); return ()=> cancelAnimationFrame(raf);
  },[sim,kappa,sweeps,arrows]);

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">Poisson–Boltzmann — Nonlinear Electrostatics</h2>
      <canvas ref={cnv} style={{width:"100%", imageRendering:"pixelated"}}/>
      <div className="grid" style={{gridTemplateColumns:"1fr 360px", gap:16}}>
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <button className="px-3 py-1 rounded bg-white/10 border border-white/10" onClick={()=>reset(sim)}>Reset</button>
          <div className="mt-2 text-sm flex gap-3">
            <label><input type="radio" checked={mode==="paint"} onChange={()=>setMode("paint")}/> paint</label>
            <label><input type="radio" checked={mode==="erase"} onChange={()=>setMode("erase")}/> erase</label>
          </div>
        </section>
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <Slider label="paint ψ" v={volts} set={setVolts} min={-2} max={2} step={0.05}/>
          <Slider label="κ (salt strength)" v={kappa} set={setKappa} min={0.2} max={2.4} step={0.05}/>
          <Slider label="sweeps/frame" v={sweeps} set={setSweeps} min={5} max={120} step={5}/>
          <Slider label="field arrows" v={arrows} set={setArrows} min={8} max={32} step={1}/>
          <Slider label="grid N" v={N} set={setN} min={96} max={224} step={16}/>
          <ActiveReflection
            title="Active Reflection — Poisson–Boltzmann"
            storageKey="reflect_pb"
            prompts={[
              'Paint +ψ and −ψ plates: note screening vs Laplace case.',
              'Increase κ: Debye screening shortens field range.',
              'Nonlinearity: large |ψ| makes contours asymmetrical.',
              "Paint +ψ and −ψ plates: note screening vs Laplace case.",
              "Increase κ: Debye screening shortens field range.",
              "Nonlinearity: large |ψ| makes contours asymmetrical."
            ]}
          />
        </section>
      </div>
    </div>
  );
}

function makeSim(N) {
  const psi = Array.from({ length: N }, () => Array(N).fill(0));
  const mask = Array.from({ length: N }, () => Array(N).fill(false));
  // grounded borders
  for (let i = 0; i < N; i++) {
    mask[0][i] = mask[N - 1][i] = mask[i][0] = mask[i][N - 1] = true;
    psi[0][i] = psi[N - 1][i] = psi[i][0] = psi[i][N - 1] = 0;
  }
  return { N, psi, mask };
}
function reset(sim) {
  const { N, psi, mask } = sim;
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      psi[y][x] = 0;
      mask[y][x] = false;
    }
  for (let i = 0; i < N; i++) {
    mask[0][i] = mask[N - 1][i] = mask[i][0] = mask[i][N - 1] = true;
  }
}
function solve(sim, kappa, sweeps) {
  const { N, psi, mask } = sim;
  const h2 = 1; // grid step scaled to 1 pixel
  const alpha = 0.25 * kappa * kappa * h2;
  for (let k = 0; k < sweeps; k++) {
    for (let y = 1; y < N - 1; y++) {
      for (let x = 1; x < N - 1; x++) {
        if (mask[y][x]) continue;
        // Picard linearization using current ψ[y][x]
        psi[y][x] =
          0.25 *
            (psi[y - 1][x] + psi[y + 1][x] + psi[y][x - 1] + psi[y][x + 1]) -
          alpha * Math.sinh(psi[y][x]);
function makeSim(N){
  const psi=Array.from({length:N},()=>Array(N).fill(0));
  const mask=Array.from({length:N},()=>Array(N).fill(false));
  // grounded borders
  for(let i=0;i<N;i++){ mask[0][i]=mask[N-1][i]=mask[i][0]=mask[i][N-1]=true; psi[0][i]=psi[N-1][i]=psi[i][0]=psi[i][N-1]=0; }
  return {N, psi, mask};
}
function reset(sim){ const {N,psi,mask}=sim; for(let y=0;y<N;y++) for(let x=0;x<N;x++){ psi[y][x]=0; mask[y][x]=false; } for(let i=0;i<N;i++){ mask[0][i]=mask[N-1][i]=mask[i][0]=mask[i][N-1]=true; } }
function solve(sim, kappa, sweeps){
  const {N,psi,mask}=sim; const h2=(1); // grid step scaled to 1 pixel
  const alpha = 0.25*kappa*kappa*h2;
  for(let k=0;k<sweeps;k++){
    for(let y=1;y<N-1;y++){
      for(let x=1;x<N-1;x++){
        if(mask[y][x]) continue;
        // Picard linearization using current ψ[y][x]
        psi[y][x] = 0.25*(psi[y-1][x]+psi[y+1][x]+psi[y][x-1]+psi[y][x+1]) - alpha*Math.sinh(psi[y][x]);
      }
    }
  }
}
function render(ctx, sim, arrows) {
  const { N, psi, mask } = sim;
  const img = ctx.createImageData(N, N);
  let mn = Infinity,
    mx = -Infinity;
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      mn = Math.min(mn, psi[y][x]);
      mx = Math.max(mx, psi[y][x]);
    }
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const t = (psi[y][x] - mn) / (mx - mn + 1e-9);
      const off = 4 * (y * N + x);
      img.data[off] = Math.floor(40 + 200 * t);
      img.data[off + 1] = Math.floor(50 + 180 * (1 - t));
      img.data[off + 2] = Math.floor(220 * (1 - t));
      img.data[off + 3] = 255;
      if (mask[y][x]) {
        img.data[off] = 255;
        img.data[off + 1] = 255;
        img.data[off + 2] = 255;
      }
    }
  ctx.putImageData(img, 0, 0);
  // Field E = −∇ψ
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1;
  const G = arrows;
  for (let j = 0; j < G; j++)
    for (let i = 0; i < G; i++) {
      const x = Math.floor(((i + 0.5) * N) / G),
        y = Math.floor(((j + 0.5) * N) / G);
      const dpx =
        (psi[y][Math.min(N - 1, x + 1)] - psi[y][Math.max(0, x - 1)]) * 0.5;
      const dpy =
        (psi[Math.min(N - 1, y + 1)][x] - psi[Math.max(0, y - 1)][x]) * 0.5;
      const Ex = -dpx,
        Ey = -dpy;
      const s = 2.0;
      ctx.beginPath();
      ctx.moveTo(x + 0.5, y + 0.5);
      ctx.lineTo(x + 0.5 + s * Ex, y + 0.5 + s * Ey);
      ctx.stroke();
    }
}
function Slider({ label, v, set, min, max, step }) {
  const show = typeof v === 'number' && v.toFixed ? v.toFixed(2) : v;
  return (
    <div className="mb-2">
      <label className="text-sm opacity-80">
        {label}: <b>{show}</b>
      </label>
      <input
        className="w-full"
        type="range"
        min={min}
        max={max}
        step={step}
        value={v}
        onChange={(e) => set(parseFloat(e.target.value))}
      />
    </div>
  );
function render(ctx, sim, arrows){
  const {N,psi,mask}=sim;
  const img=ctx.createImageData(N,N);
  let mn=Infinity,mx=-Infinity; for(let y=0;y<N;y++) for(let x=0;x<N;x++){ mn=Math.min(mn,psi[y][x]); mx=Math.max(mx,psi[y][x]); }
  for(let y=0;y<N;y++) for(let x=0;x<N;x++){
    const t=(psi[y][x]-mn)/(mx-mn+1e-9);
    const off=4*(y*N+x);
    img.data[off]=Math.floor(40+200*t);
    img.data[off+1]=Math.floor(50+180*(1-t));
    img.data[off+2]=Math.floor(220*(1-t));
    img.data[off+3]=255;
    if(mask[y][x]){ img.data[off]=255; img.data[off+1]=255; img.data[off+2]=255; }
  }
  ctx.putImageData(img,0,0);
  // Field E = −∇ψ
  ctx.strokeStyle="#fff"; ctx.lineWidth=1;
  const G=arrows;
  for(let j=0;j<G;j++) for(let i=0;i<G;i++){
    const x=Math.floor((i+0.5)*N/G), y=Math.floor((j+0.5)*N/G);
    const dpx=(psi[y][Math.min(N-1,x+1)]-psi[y][Math.max(0,x-1)])*0.5;
    const dpy=(psi[Math.min(N-1,y+1)][x]-psi[Math.max(0,y-1)][x])*0.5;
    const Ex=-dpx, Ey=-dpy;
    const s=2.0; ctx.beginPath(); ctx.moveTo(x+0.5,y+0.5); ctx.lineTo(x+0.5+s*Ex,y+0.5+s*Ey); ctx.stroke();
  }
}
function Slider({label,v,set,min,max,step}){ const show=(typeof v==="number"&&v.toFixed)?v.toFixed(2):v;
  return (<div className="mb-2"><label className="text-sm opacity-80">{label}: <b>{show}</b></label>
  <input className="w-full" type="range" min={min} max={max} step={step}
         value={v} onChange={e=>set(parseFloat(e.target.value))}/></div>);
}
