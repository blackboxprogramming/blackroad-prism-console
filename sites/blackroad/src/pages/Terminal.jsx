import { useRef, useState, useEffect } from "react";

// Quantum equations to display
const QUANTUM_EQUATIONS = [
  "iħ ∂ψ/∂t = Ĥ ψ   (Time-dependent Schrödinger)",
  "Ĥ ψ = E ψ        (Time-independent Schrödinger)",
  "H = p²/2m + V(x)",
  "⟨x|p⟩ = (1/√(2πħ)) e^(i p x / ħ)",
  "[x,p] = iħ",
  "|ψ⟩ = Σₙ cₙ |φₙ⟩",
  "Path integral: ∫ D[x(t)] e^(i S[x]/ħ)",
  "Dirac: (iγᵘ ∂ᵤ - m)ψ = 0",
];

const FRAMES = ['.', 'o', 'O', '@', '*', '◉'];

export default function Terminal(){
  const [lines,setLines]=useState(["Type 'help' or 'health'."]); 
  const inputRef=useRef(null);
  const [quantumActive, setQuantumActive] = useState(false);
  const [quantumFrame, setQuantumFrame] = useState(0);

  useEffect(() => {
    if (!quantumActive) return;
    const timer = setInterval(() => {
      setQuantumFrame(f => f + 1);
    }, 60);
    return () => clearInterval(timer);
  }, [quantumActive]);

  const run = async (cmd)=>{
    const [c,...rest]=cmd.trim().split(/\s+/);
    if(!c) return;
    if(c==="help") return ["help, health, echo <text>, clear, quantum"];
    if(c==="echo") return [rest.join(" ")];
    if(c==="clear") return ["\x07"]; // bell; UI clears
    if(c==="health"){ try{ const r=await fetch("/api/health",{cache:"no-store"}); return [await r.text()]; }catch(e){ return [String(e)]; } }
    if(c==="quantum") {
      setQuantumActive(true);
      setQuantumFrame(0);
      return ["🌌 Quantum math visualization started (animations below)", "Press Ctrl+C or type 'clear' to stop"];
    }
    return [`unknown: ${c}`];
  };

  const onKey = async (e)=>{ 
    if(e.key==="Enter"){ 
      e.preventDefault(); 
      const v=e.currentTarget.value; 
      e.currentTarget.value="";
      if(v.trim() === "clear") setQuantumActive(false);
      setLines(x=>[...x,`$ ${v}`]); 
      const out=await run(v); 
      if(out?.[0]==="\x07"){ 
        setLines([]); 
        setQuantumActive(false);
        return; 
      } 
      setLines(x=>[...x,...out]); 
    } 
  };

  const renderQuantumVisualization = () => {
    if (!quantumActive) return null;
    
    const t = quantumFrame * 0.06;
    const visLines = [];
    
    visLines.push("╔═══════════════════════════════════════════════════════════════╗");
    visLines.push("║           QUANTUM MATH VISUALIZATION                         ║");
    visLines.push("╚═══════════════════════════════════════════════════════════════╝");
    visLines.push("");
    
    QUANTUM_EQUATIONS.forEach((eq, j) => {
      const phase = Math.cos(t + j * 0.5);
      const marker = FRAMES[(quantumFrame + j) % FRAMES.length];
      visLines.push(`${eq}   phase=${phase.toFixed(2)} ${marker}`);
    });
    
    // Wave visualization
    visLines.push("");
    const k = 0.25;
    let waveLine = "";
    for (let x = -30; x <= 30; x += 2) {
      waveLine += Math.cos(k * x - t) > 0.2 ? '◼' : '·';
    }
    visLines.push(waveLine);
    
    return visLines;
  };

  const displayLines = quantumActive 
    ? [...lines, ...renderQuantumVisualization()]
    : lines;

  return (
    <div>
      <h2 className="text-lg font-semibold mb-2">Terminal</h2>
      <div className="h-56 overflow-auto border border-neutral-800 rounded p-2 bg-black/50 mb-2">
        {displayLines.map((l,i)=>(<div key={i} className="font-mono text-sm">{l}</div>))}
      </div>
      <input ref={inputRef} onKeyDown={onKey} placeholder="type a command…" className="w-full p-2 rounded bg-neutral-900 border border-neutral-700 font-mono"/>
    </div>);
}
