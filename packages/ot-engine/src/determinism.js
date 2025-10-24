/**
 * Deterministic RNG using LCG (same parameters as Numerical Recipes).
 * @param {number} seed
 * @returns {() => number}
 */
function createDeterministicRng(seed) {
  let state = (seed >>> 0) || 1;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
}

module.exports = { createDeterministicRng };
