import { useMemo, useState } from "react";
import ActiveReflection from "./ActiveReflection.jsx";

function rng(seed) {
  let s = seed | 0 || 99;
  return () => ((s = (1103515245 * s + 12345) >>> 0) / 2 ** 32);
}
function modPow(a, e, m) {
  let r = 1n,
    x = BigInt(a) % m,
    k = BigInt(e);
  while (k > 0n) {
    if (k & 1n) r = (r * x) % m;
    x = (x * x) % m;
    k >>= 1n;
  }
  return r;
}
function egcd(a, b) {
  if (b === 0n) return [a, 1n, 0n];
  const [g, x, y] = egcd(b, a % b);
  return [g, y, x - (a / b) * y];
}
function invMod(a, m) {
  const [g, x] = egcd(a, m);
  if (g !== 1n) return null;
  let r = x % m;
  if (r < 0) r += m;
  return r;
}

// deterministic Miller–Rabin for 32-bit-ish (educational, small)
function isPrime32(n) {
  if (n < 2n) return false;
  for (const p of [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n]) {
    if (n === p) return true;
    if (n % p === 0n) return false;
  }
  let d = n - 1n,
    s = 0n;
  while ((d & 1n) === 0n) {
    d >>= 1n;
    s++;
  }
  const bases = [2n, 7n, 61n]; // good for 2^32
  for (const a of bases) {
    let x = modPow(a, d, n);
    if (x === 1n || x === n - 1n) continue;
    let comp = true;
    for (let r = 1n; r < s; r++) {
      x = (x * x) % n;
      if (x === n - 1n) {
        comp = false;
        break;
      }
    }
    if (comp) return false;
  }
  return true;
}
function randomPrime(bits, r) {
  const min = 1n << BigInt(bits - 1);
  const max = (1n << BigInt(bits)) - 1n;
  while (true) {
    let v = 0n;
    for (let i = 0; i < bits; i++) {
      v = (v << 1n) | (r() < 0.5 ? 0n : 1n);
    }
    v |= 1n; // odd
    if (v < min) v += min;
    if (v > max) v = (v % (max - min)) + min;
    if (isPrime32(v)) return v;
  }
}

export default function RSAToyLab() {
  const [bits, setBits] = useState(16); // small for UI; not secure!
  const [seed, setSeed] = useState(2025);
  const [msg, setMsg] = useState("42");

  const { p, q, n, phi, e, d } = useMemo(() => {
    const r = rng(seed);
    const p = randomPrime(bits, r);
    let q = randomPrime(bits, r);
    while (q === p) q = randomPrime(bits, r);
    const n = p * q;
    const phi = (p - 1n) * (q - 1n);
    let e = 65537n;
    if (phi % e === 0n) e = 257n;
    const d = invMod(e, phi);
    return { p, q, n, phi, e, d };
  }, [bits, seed]);

  const m = BigInt(parseInt(msg) || 0);
  const c = modPow(m, e, n);
  const dec = d ? modPow(c, d, n) : 0n;

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">RSA Toy — intuition only (tiny primes)</h2>
      <div className="grid" style={{ gridTemplateColumns: "1fr 320px", gap: 16 }}>
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <table className="text-sm w-full">
            <tbody>
              <Tr k="p (prime)" v={p.toString()} />
              <Tr k="q (prime)" v={q.toString()} />
              <Tr k="n = p·q" v={n.toString()} />
              <Tr k="φ = (p−1)(q−1)" v={phi.toString()} />
              <Tr k="e (public)" v={e.toString()} />
              <Tr k="d (private)" v={d ? d.toString() : "(no inverse)"} />
            </tbody>
          </table>
          <div className="mt-3">
            <label className="text-sm opacity-80">message m (integer): </label>
            <input
              className="w-full p-2 rounded bg-white/10 border border-white/10"
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
            />
            <p className="text-sm mt-2">
              cipher c = m^e mod n → <b>{c.toString()}</b>
            </p>
            <p className="text-sm">decrypt m = c^d mod n → <b>{dec.toString()}</b></p>
          </div>
          <p className="text-xs opacity-70 mt-2">
            ⚠️ Not secure: tiny primes, toy Miller–Rabin. For intuition only.
          </p>
        </section>
        <section className="p-3 rounded-lg bg-white/5 border border-white/10">
          <h3 className="font-semibold mb-2">Controls</h3>
          <Slider label="bits per prime" v={bits} set={setBits} min={12} max={24} step={1} />
          <Slider label="seed" v={seed} set={setSeed} min={1} max={9999} step={1} />
          <ActiveReflection
            title="Active Reflection — RSA"
            storageKey="reflect_rsa"
            prompts={[
              "What happens to n and φ when you increase bits?",
              "Try a message m ≥ n — what must be true for RSA to decode correctly?",
              "Why must gcd(e, φ)=1 for decryption to exist?",
              "Why is factoring n hard (and why small n here is unsafe)?",
            ]}
          />
        </section>
      </div>
    </div>
  );
}

function Tr({ k, v }) {
  return (
    <tr>
      <td className="pr-3 opacity-80">{k}</td>
      <td>
        <code>{v}</code>
      </td>
    </tr>
  );
}
function Slider({ label, v, set, min, max, step }) {
  const show = typeof v === "number" && v.toFixed ? v.toFixed(3) : v;
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
}
