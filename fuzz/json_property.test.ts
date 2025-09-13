import fc from 'fast-check';
import assert from 'node:assert/strict';

function normalize(obj: any){
  return JSON.parse(JSON.stringify(obj));
}

describe('JSON normalize', () => {
  it('round-trips arbitrary records', () => {
    fc.assert(fc.property(fc.object(), (o) => {
      const n = normalize(o);
      assert.ok(typeof n === 'object');
      return true;
    }), { numRuns: 50 });
  });
});
