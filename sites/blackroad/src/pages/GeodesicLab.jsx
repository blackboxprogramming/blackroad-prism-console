import { useMemo, useState } from 'react';
import * as Q from '../lib/qutrit.ts';

function c(re = 0, im = 0) {
  return [re, im];
}

export default function GeodesicLab() {
  const [r1a, pr1a] = useState(1 / Math.sqrt(3)),
    [p1a, pp1a] = useState(0);
  const [r1b, pr1b] = useState(1 / Math.sqrt(3)),
    [p1b, pp1b] = useState(0);
  const [r1c, pr1c] = useState(1 / Math.sqrt(3)),
    [p1c, pp1c] = useState(0);
  const [r2a, pr2a] = useState(1),
    [p2a, pp2a] = useState(0);
  const [r2b, pr2b] = useState(0),
    [p2b, pp2b] = useState(0);
  const [r2c, pr2c] = useState(0),
    [p2c, pp2c] = useState(0);
  const [steps, setSteps] = useState(12);

  const psi0 = useMemo(() => {
    return Q.ket([
      c(r1a * Math.cos(p1a), r1a * Math.sin(p1a)),
      c(r1b * Math.cos(p1b), r1b * Math.sin(p1b)),
      c(r1c * Math.cos(p1c), r1c * Math.sin(p1c)),
    ]);
  }, [r1a, p1a, r1b, p1b, r1c, p1c]);
  const psi1 = useMemo(() => {
    return Q.ket([
      c(r2a * Math.cos(p2a), r2a * Math.sin(p2a)),
      c(r2b * Math.cos(p2b), r2b * Math.sin(p2b)),
      c(r2c * Math.cos(p2c), r2c * Math.sin(p2c)),
    ]);
  }, [r2a, p2a, r2b, p2b, r2c, p2c]);

  const dist = Q.fsDistance(psi0, psi1);
  const pts = Q.geodesicPoints(psi0, psi1, steps);

  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-3">Geodesic Lab — CP² (Fubini–Study)</h2>

      <div
        className="grid"
        style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16 }}
      >
        <Panel title="Start |ψ₀⟩">
          <Amp label="r_a" v={r1a} set={pr1a} />
          <Phs label="φ_a" v={p1a} set={pp1a} />
          <Amp label="r_b" v={r1b} set={pr1b} />
          <Phs label="φ_b" v={p1b} set={pp1b} />
          <Amp label="r_c" v={r1c} set={pr1c} />
          <Phs label="φ_c" v={p1c} set={pp1c} />
        </Panel>

        <Panel title="Target |ψ₁⟩">
          <Amp label="r_a" v={r2a} set={pr2a} />
          <Phs label="φ_a" v={p2a} set={pp2a} />
          <Amp label="r_b" v={r2b} set={pr2b} />
          <Phs label="φ_b" v={p2b} set={pp2b} />
          <Amp label="r_c" v={r2c} set={pr2c} />
          <Phs label="φ_c" v={p2c} set={pp2c} />
        </Panel>

        <Panel title="Geodesic">
          <Slider label="steps" v={steps} set={setSteps} min={2} max={64} step={1} />
          <p className="text-sm mt-2">
            Fubini–Study distance: <code>{dist.toFixed(6)}</code> rad
          </p>
          <ol className="text-xs mt-2 space-y-1 max-h-64 overflow-auto pr-1">
            {pts.map((p, i) => {
              const pr = Q.probs([p[0], p[1], p[2]]);
              return (
                <li key={i}>
                  <b>
                    t={i}/{steps}
                  </b>{' '}
                  — probs: <code>{pr.map((x) => x.toFixed(3)).join(' • ')}</code>
                </li>
              );
            })}
          </ol>
        </Panel>
      </div>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <section className="p-3 rounded-lg bg-white/5 border border-white/10">
      <h3 className="font-semibold mb-2">{title}</h3>
      {children}
    </section>
  );
}
function Amp({ label, v, set }) {
  return <Slider label={label} v={v} set={set} min={0} max={1} step={0.01} />;
}
function Phs({ label, v, set }) {
  return <Slider label={label} v={v} set={set} min={-Math.PI} max={Math.PI} step={0.01} />;
}
function Slider({ label, v, set, min, max, step }) {
  return (
    <div className="mb-2">
      <label className="text-sm opacity-80">
        {label}: <b>{v.toFixed ? v.toFixed(3) : v}</b>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={v}
        onChange={(e) => set(parseFloat(e.target.value))}
        className="w-full"
      />
    </div>
  );
}
