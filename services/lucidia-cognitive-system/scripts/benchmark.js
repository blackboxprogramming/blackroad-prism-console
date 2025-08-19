import { performance } from 'node:perf_hooks';
const t0 = performance.now();
// ... run synthetic tasks
const t1 = performance.now();
console.log(`Benchmark finished in ${(t1 - t0).toFixed(2)}ms`);
