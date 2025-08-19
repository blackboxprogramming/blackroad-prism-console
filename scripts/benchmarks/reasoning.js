/* FILE: scripts/benchmarks/reasoning.js */
import { performance } from 'node:perf_hooks';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';

function parseArgs(argv) {
const out = { runs: 25, depth: 10, out: './benchmarks/latest.json' };
for (let i = 2; i < argv.length; i++) {
const a = argv[i];
if (a === '--runs') out.runs = Number(argv[++i] || out.runs);
else if (a === '--depth') out.depth = Number(argv[++i] || out.depth);
else if (a === '--out') out.out = argv[++i] || out.out;
}
return out;
}

async function maybeLoadLucidia() {
try {
const mod = await import('../../src/comprehensive-lucidia-system.js');
if (!mod || !mod.LucidiaSystem) throw new Error('LucidiaSystem not exported');
return new mod.LucidiaSystem({ monitoring: { enabled: false } });
} catch (e) {
return null; // fallback synthetic
}
}

function stats(arr) {
const a = [...arr].sort((x, y) => x - y);
const sum = a.reduce((s, v) => s + v, 0);
const mean = sum / a.length;
const p = q => a[Math.max(0, Math.min(a.length - 1, Math.floor(q * (a.length - 1))))];
return { min: a[0], p50: p(0.5), p90: p(0.9), p99: p(0.99), max: a[a.length - 1], mean };
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
const opts = parseArgs(process.argv);
if (!existsSync('./benchmarks')) mkdirSync('./benchmarks');

const system = await maybeLoadLucidia();
const latencies = [];
const runs = opts.runs;

for (let i = 0; i < runs; i++) {
const t0 = performance.now();
if (system?.processQuestion) {
try {
// Keep the prompt deterministic for fair comparison
await system.processQuestion('benchmark: coherence-depth', { depth: opts.depth });
} catch {
// If user code throws, still measure latency path
}
} else {
// Synthetic fallback
await sleep(50 + Math.random() * 150);
}
const t1 = performance.now();
latencies.push(t1 - t0);
}

const s = stats(latencies);
const out = {
ts: new Date().toISOString(),
runs,
depth: opts.depth,
latencies_ms: s,
notes: system ? 'real' : 'synthetic-fallback'
};

writeFileSync(opts.out, JSON.stringify(out, null, 2));
console.log(`Wrote ${opts.out}`);
})();
