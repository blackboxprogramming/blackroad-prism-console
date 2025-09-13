import fc from 'fast-check';
import assert from 'node:assert/strict';

function parseMaybeJSON(s:string){
  try { return JSON.parse(s); } catch { return null; }
}

fc.assert(fc.property(fc.anything(), (x) => {
  const s = typeof x === 'string' ? x : JSON.stringify(x);
  const out = parseMaybeJSON(s);
  assert.ok(out === null || typeof out === 'object' || typeof out === 'number' || typeof out === 'string' || typeof out === 'boolean');
  return true;
}), { numRuns: 100 });
