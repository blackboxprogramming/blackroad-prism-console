import { useState, useEffect } from "react";

export default function RoadGlitch() {
  const [prompt, setPrompt] = useState("");
  const [output, setOutput] = useState("");
  const [mood, setMood] = useState("neutral");
  const [shift, setShift] = useState(0);

  const moods = ["neutral", "dreamy", "chaotic", "euphoric", "dystopian"];
  const filters = {
    neutral: "",
    dreamy: "hue-rotate(160deg) saturate(1.4)",
    chaotic: "invert(1) hue-rotate(90deg) contrast(1.8)",
    euphoric: "hue-rotate(300deg) saturate(2)",
    dystopian: "grayscale(1) contrast(1.2)",
  };

  useEffect(() => {
    const id = setInterval(() => setShift((s) => s + 15), 1500);
    return () => clearInterval(id);
  }, []);

  const glitchText = (txt) =>
    txt
      .split("")
      .map((ch) =>
        Math.random() > 0.8 ? String.fromCharCode(33 + Math.random() * 94) : ch
      )
      .join("");

  const runGlitch = (e) => {
    e.preventDefault();
    setOutput(glitchText(prompt));
  };

  return (
    <div
      className="card relative overflow-hidden"
      style={{ filter: `${filters[mood]} hue-rotate(${shift}deg)` }}
      onMouseMove={() => setShift((s) => s + 5)}
    >
      <style>{`
        .glitch{position:relative;font-family:monospace;}
        .glitch::before,.glitch::after{content:attr(data-text);position:absolute;left:0;top:0;width:100%;overflow:hidden;}
        .glitch::before{left:2px;text-shadow:-2px 0 magenta;clip-path:inset(0 0 60% 0);animation:glitchTop 1s infinite linear alternate-reverse;}
        .glitch::after{left:-2px;text-shadow:-2px 0 cyan;clip-path:inset(60% 0 0 0);animation:glitchBot 1s infinite linear alternate-reverse;}
        @keyframes glitchTop{0%{transform:translate(-2px,-2px);}50%{transform:translate(2px,2px);}100%{transform:translate(-2px,2px);}}
        @keyframes glitchBot{0%{transform:translate(2px,2px);}50%{transform:translate(-2px,-2px);}100%{transform:translate(2px,-2px);}}
      `}</style>
      <h2 className="text-xl font-semibold mb-2">RoadGlitch</h2>
      <form onSubmit={runGlitch} className="space-y-2">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter prompt..."
          className="w-full p-2 rounded bg-neutral-900 border border-neutral-700"
        />
        <div className="flex gap-2 items-center">
          <select
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            className="bg-neutral-900 border border-neutral-700 rounded p-2"
          >
            {moods.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
          <button type="submit" className="btn-secondary">
            Glitch
          </button>
        </div>
      </form>
      <div className="mt-4 min-h-[4rem]">
        {output && <div className="glitch" data-text={output}>{output}</div>}
      </div>
    </div>
  );
}
