/**
 * Compute a rasterized power diagram (Laguerre cells) for the given sites.
 * @param {{x:number,y:number}[]} sites
 * @param {number[]} weights
 * @param {{width:number,height:number,data:Float64Array|Float32Array|number[],cellArea?:number}} density
 * @param {{includeMass?:boolean}} [options]
 * @returns {{owner:Uint32Array, areas:Float64Array, masses?:Float64Array}}
 */
function rasterizePowerDiagram(sites, weights, density, options = {}) {
  const { width, height, data, cellArea = 1 } = density;
  if (sites.length === 0) {
    throw new Error('At least one site is required');
  }
  if (weights.length !== sites.length) {
    throw new Error('weights length must match sites length');
  }
  const includeMass = Boolean(options.includeMass);
  const owner = new Uint32Array(width * height);
  const areas = new Float64Array(sites.length);
  const masses = includeMass ? new Float64Array(sites.length) : undefined;
  const weightScale = options.weightScale || 1;
  const supersample = options.supersample && options.supersample > 1 ? Math.floor(options.supersample) : 1;
  const sampleWeight = cellArea / (supersample * supersample);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let baseIdx = 0;
      let baseVal = Infinity;
      for (let i = 0; i < sites.length; i++) {
        const dx = x - sites[i].x;
        const dy = y - sites[i].y;
        const w = weights[i] || 0;
        const val = dx * dx + dy * dy - w * weightScale;
        if (val < baseVal) {
          baseVal = val;
          baseIdx = i;
        }
      }
      const idx = y * width + x;
      owner[idx] = baseIdx;
      if (includeMass && masses) {
        if (supersample === 1) {
          masses[baseIdx] += data[idx] * cellArea;
        }
      }
      areas[baseIdx] += cellArea;
      if (includeMass && masses && supersample > 1) {
        for (let sy = 0; sy < supersample; sy++) {
          for (let sx = 0; sx < supersample; sx++) {
            let best = 0;
            let valBest = Infinity;
            const sampleX = x + (sx + 0.5) / supersample;
            const sampleY = y + (sy + 0.5) / supersample;
            for (let i = 0; i < sites.length; i++) {
              const dx = sampleX - sites[i].x;
              const dy = sampleY - sites[i].y;
              const w = weights[i] || 0;
              const val = dx * dx + dy * dy - w * weightScale;
              if (val < valBest) {
                valBest = val;
                best = i;
              }
            }
            masses[best] += data[idx] * sampleWeight;
          }
        }
      }
    }
  }

  return includeMass ? { owner, areas, masses } : { owner, areas };
}

module.exports = { rasterizePowerDiagram };
