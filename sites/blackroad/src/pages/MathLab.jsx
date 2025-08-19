import { useMemo, useState } from 'react';
import * as Q from '../lib/qutrit.ts';

function c(re = 0, im = 0) {
  return [re, im];
}

export default function MathLab() {
  // amplitudes with phases: a= r_a e^{iφ_a}, etc.
  const [ra, setRa] = useState(1 / Math.sqrt(3));
  const [pa, setPa] = useState(0);
  const [rb, setRb] = useState(1 / Math.sqrt(3));
  const [pb, setPb] = useState(0);
  const [rc, setRc] = useState(1 / Math.sqrt(3));
  const [pc, setPc] = useState(0);

  const [t1, setT1] = useState(0.0); // SU(3) θ_1..θ_8
  const [t2, setT2] = useState(0.0);
  const [t3, setT3] = useState(0.0);
  const [t8, setT8] = useState(0.0);
  const [omega0, setOmega0] = useState(0.0);
  const [time, setTime] = useState(0.0);
  const [g1, setG1] = useState(0.0);
  const [g2, setG2] = useState(0.0);
  const [g3, setG3] = useState(0.0);

  const psi0 = useMemo(() => {
    const a = c(ra * Math.cos(pa), ra * Math.sin(pa));
    const b = c(rb * Math.cos(pb), rb * Math.sin(pb));
    const cC = c(rc * Math.cos(pc), rc * Math.sin(pc));
    return Q.ket([a, b, cC]);
  }, [ra, pa, rb, pb, rc, pc]);

  const rho0 = useMemo(() => Q.rhoPure(psi0), [psi0]);
  const H = useMemo(
    () => Q.hamiltonianSU3([t1, t2, t3, 0, 0, 0, 0, t8], omega0),
    [t1, t2, t3, t8, omega0]
  );

  const rhoU = useMemo(() => Q.evolveUnitary(rho0, H, time), [rho0, H, time]);
  const rhoL = useMemo(
    () => Q.evolveLindbladDephasing(rho0, H, time, [g1, g2, g3]),
    [rho0, H, time, g1, g2, g3]
  );

  const pr = Q.probs([psi0[0], psi0[1], psi0[2]]);
  const H0 = Q.entropy(rho0, true);
  const P0 = Q.purity(rho0);
  const Ht = Q.entropy(rhoU, true);
  const Pt = Q.purity(rhoU);
  const r8 = Q.bloch8(rhoU);
  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-3">MathLab — Qutrit Engine</h2>
      <div
        className="grid"
        style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 16 }}
      >
        <Panel title="Amplitudes (r, phase)">
          <Slider label="r_a" v={ra} set={setRa} min={0} max={1} step={0.01} />
          <Slider label="φ_a" v={pa} set={setPa} min={-Math.PI} max={Math.PI} step={0.01} />
          <Slider label="r_b" v={rb} set={setRb} min={0} max={1} step={0.01} />
          <Slider label="φ_b" v={pb} set={setPb} min={-Math.PI} max={Math.PI} step={0.01} />
          <Slider label="r_c" v={rc} set={setRc} min={0} max={1} step={0.01} />
          <Slider label="φ_c" v={pc} set={setPc} min={-Math.PI} max={Math.PI} step={0.01} />
          <Stat label="Basis probs" value={`${pr.map((x) => x.toFixed(3)).join(' • ')}`} />
          <Stat label="H(ρ0), P(ρ0)" value={`${H0.toFixed(3)}, ${P0.toFixed(3)}`} />
        </Panel>

        <Panel title="Hamiltonian (SU(3)) & Evolution">
          <Slider label="θ1" v={t1} set={setT1} min={-2} max={2} step={0.01} />
          <Slider label="θ2" v={t2} set={setT2} min={-2} max={2} step={0.01} />
          <Slider label="θ3" v={t3} set={setT3} min={-2} max={2} step={0.01} />
          <Slider label="θ8" v={t8} set={setT8} min={-2} max={2} step={0.01} />
          <Slider label="ω0·I" v={omega0} set={setOmega0} min={-2} max={2} step={0.01} />
          <Slider label="time t" v={time} set={setTime} min={0} max={6.28} step={0.01} />
          <Stat label="H(ρ(t)), P(ρ(t))" value={`${Ht.toFixed(3)}, ${Pt.toFixed(3)}`} />
          <Stat label="Bloch r (8 dims)" value={r8.map((x) => x.toFixed(2)).join(', ')} />
        </Panel>

        <Panel title="Lindblad Dephasing (γ)">
          <Slider label="γ₁" v={g1} set={setG1} min={0} max={2} step={0.01} />
          <Slider label="γ₂" v={g2} set={setG2} min={0} max={2} step={0.01} />
          <Slider label="γ₃" v={g3} set={setG3} min={0} max={2} step={0.01} />
          <Stat label="Purity (dephased)" value={Q.purity(rhoL).toFixed(3)} />
          <button
            className="btn"
            onClick={() => {
              const m = Q.measureComputational(rhoL);
              alert(`Measured outcome ${m.outcome} with p=${m.prob.toFixed(3)}`);
            }}
          >
            Measure ρ_L in |-1&gt;,|0&gt;,|+1&gt;
          </button>
        </Panel>

        <Panel title="Creative Boundary Energy (Kc)">
          <KcDemo />
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
function Slider({ label, v, set, min, max, step }) {
  return (
    <div className="mb-2">
      <label className="text-sm opacity-80">
        {label}: <b>{typeof v === 'number' ? v.toFixed(3) : v}</b>
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
function Stat({ label, value }) {
  return (
    <div className="text-sm mt-1">
      <span className="opacity-70">{label}:</span> <code>{value}</code>
    </div>
  );
}
function KcDemo() {
  const [sigmaC, setSigma] = useState(1);
  const [gamma, setGamma] = useState(0.5);
  const [chi, setChi] = useState(0.3);
  const [lambda, setLambda] = useState(0.2);
  const [du, setDu] = useState(1.0);
  const K = Q.creativeEnergy(sigmaC, gamma, chi, lambda, du);
  return (
    <>
      <Slider label="σ_c" v={sigmaC} set={setSigma} min={0} max={3} step={0.01} />
      <Slider label="γ" v={gamma} set={setGamma} min={-1} max={3} step={0.01} />
      <Slider label="χ" v={chi} set={setChi} min={-2} max={2} step={0.01} />
      <Slider label="λ" v={lambda} set={setLambda} min={0} max={2} step={0.01} />
      <Slider label="δu" v={du} set={setDu} min={-5} max={5} step={0.01} />
      <Stat label="K_c" value={K.toFixed(3)} />
    </>
  );
}
export default function MathLab() {
  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-2">MathLab</h2>
      <p>General math experiments live here.</p>
    </div>
  );
}
