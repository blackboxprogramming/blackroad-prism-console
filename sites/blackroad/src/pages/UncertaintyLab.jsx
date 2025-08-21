import { useMemo, useState } from 'react';
import * as Q from '../lib/qutrit.ts';
import { Packs, Sx as SxSpin, Sy as SySpin, Sz as SzSpin } from '../lib/observables.ts';
import { robertsonSchrodinger, spin1TripleBound, pairwiseBounds } from '../lib/uncertainty.ts';

function c(re = 0, im = 0) {
  return [re, im];
}

export default function UncertaintyLab() {
  const packNames = Object.keys(Packs);
  const [packName, setPackName] = useState(packNames[0]);
  const pack = Packs[packName];
  const obsNames = Object.keys(pack);
  const [Aname, setA] = useState(obsNames[0]);
  const [Bname, setB] = useState(obsNames[1] || obsNames[0]);
  const [Cname, setC] = useState(obsNames[2] || obsNames[0]);

  const [ra, setRa] = useState(1 / Math.sqrt(3));
  const [pa, setPa] = useState(0);
  const [rb, setRb] = useState(1 / Math.sqrt(3));
  const [pb, setPb] = useState(0);
  const [rc, setRc] = useState(1 / Math.sqrt(3));
  const [pc, setPc] = useState(0);
  const psi = useMemo(() => {
    const a = c(ra * Math.cos(pa), ra * Math.sin(pa));
    const b = c(rb * Math.cos(pb), rb * Math.sin(pb));
    const d = c(rc * Math.cos(pc), rc * Math.sin(pc));
    return Q.ket([a, b, d]);
  }, [ra, pa, rb, pb, rc, pc]);
  const rho = useMemo(() => Q.rhoPure(psi), [psi]);

  const A = pack[Aname],
    B = pack[Bname],
    C = pack[Cname];
  const rs = robertsonSchrodinger(rho, A, B);
  const tri =
    packName.startsWith('Spin-1') && 'Sx' in pack && 'Sy' in pack && 'Sz' in pack
      ? spin1TripleBound(rho, pack['Sx'], pack['Sy'], pack['Sz'])
      : null;
  const pw = pairwiseBounds(rho, A, B, C);

  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-3">Uncertainty Lab</h2>
      <div
        className="grid"
        style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16 }}
      >
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <h3 className="font-semibold mb-2">State |ψ⟩</h3>
          <Slider label="r_a" v={ra} set={setRa} min={0} max={1} step={0.01} />
          <Slider label="φ_a" v={pa} set={setPa} min={-Math.PI} max={Math.PI} step={0.01} />
          <Slider label="r_b" v={rb} set={setRb} min={0} max={1} step={0.01} />
          <Slider label="φ_b" v={pb} set={setPb} min={-Math.PI} max={Math.PI} step={0.01} />
          <Slider label="r_c" v={rc} set={setRc} min={0} max={1} step={0.01} />
          <Slider label="φ_c" v={pc} set={setPc} min={-Math.PI} max={Math.PI} step={0.01} />
          <p className="text-sm opacity-80 mt-2">
            Basis probs:{' '}
            <code>
              {Q.probs([psi[0], psi[1], psi[2]])
                .map((x) => x.toFixed(3))
                .join(' • ')}
            </code>
          </p>
        </section>

        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <h3 className="font-semibold mb-2">Observables</h3>
          <label className="block text-sm mb-1">Pack</label>
          <select
            className="w-full mb-2 text-black"
            value={packName}
            onChange={(e) => {
              setPackName(e.target.value);
              const names = Object.keys(Packs[e.target.value]);
              setA(names[0]);
              setB(names[1] || names[0]);
              setC(names[2] || names[0]);
            }}
          >
            {packNames.map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
          <Row label="A">
            <Select value={Aname} set={setA} options={obsNames} />
          </Row>
          <Row label="B">
            <Select value={Bname} set={setB} options={obsNames} />
          </Row>
          <Row label="C">
            <Select value={Cname} set={setC} options={obsNames} />
          </Row>
        </section>

        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <h3 className="font-semibold mb-2">Robertson–Schrödinger (A,B)</h3>
          <Table
            rows={[
              ['ΔA²', rs.dA2.toFixed(6)],
              ['ΔB²', rs.dB2.toFixed(6)],
              ['LHS ΔA²ΔB²', rs.lhs.toFixed(6)],
              ["RHS ¼|⟨[A,B]⟩|² + ¼|⟨{A',B'}⟩|²", rs.rhs.toFixed(6)],
              ['Satisfied', rs.satisfied ? 'yes' : 'no'],
            ]}
          />
          <p className="text-xs opacity-70 mt-2">
            We compute both commutator and centered anti-commutator terms.
          </p>
        </section>

        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <h3 className="font-semibold mb-2">Pairwise bounds (A,B,C)</h3>
          <Table
            rows={[
              ['AB LHS', pw.AB.lhs.toFixed(6)],
              ['AB RHS', pw.AB.rhs.toFixed(6)],
              ['BC LHS', pw.BC.lhs.toFixed(6)],
              ['BC RHS', pw.BC.rhs.toFixed(6)],
              ['CA LHS', pw.CA.lhs.toFixed(6)],
              ['CA RHS', pw.CA.rhs.toFixed(6)],
            ]}
          />
          <p className="text-xs opacity-70 mt-2">
            No universal closed-form for ΔAΔBΔC is shown here; we report solid pairwise RS bounds.
          </p>
        </section>

        {tri && (
          <section className="p-3 rounded-lg bg-white/5 border border-white/10">
            <h3 className="font-semibold mb-2">Spin-1 triple (Sx,Sy,Sz)</h3>
            <Table
              rows={[
                ['Var sum', tri.sumVar.toFixed(6)],
                ['Lower bound (s=1)', tri.lowerBound.toFixed(6)],
                ['||⟨S⟩||', tri.normE.toFixed(6)],
                ['Satisfied', tri.satisfied ? 'yes' : 'no'],
              ]}
            />
            <p className="text-xs opacity-70 mt-2">
              Using S² = s(s+1) with s=1 → exact lower bound ∑Var ≥ 1.
            </p>
          </section>
        )}
      </div>
    </div>
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
function Row({ label, children }) {
  return (
    <div className="mb-2">
      <span className="text-sm opacity-80">{label}:</span> {children}
    </div>
  );
}
function Select({ value, set, options }) {
  return (
    <select className="w-full text-black" value={value} onChange={(e) => set(e.target.value)}>
      {options.map((o) => (
        <option key={o}>{o}</option>
      ))}
    </select>
  );
}
function Table({ rows }) {
  return (
    <table className="text-sm w-full">
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            <td className="py-0.5 pr-2 opacity-80">{r[0]}</td>
            <td>
              <code>{r[1]}</code>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
