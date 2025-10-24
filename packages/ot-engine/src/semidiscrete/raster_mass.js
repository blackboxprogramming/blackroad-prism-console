/**
 * @typedef {Object} DensityField
 * @property {number} width
 * @property {number} height
 * @property {Float64Array|Float32Array|number[]} data
 * @property {number} [cellArea]
 */

/**
 * Compute the total mass of a raster density (sum of density * cellArea).
 * @param {DensityField} density
 * @returns {number}
 */
function computeDensityMass(density) {
  const { width, height, data, cellArea = 1 } = density;
  if (!width || !height || !data) {
    throw new Error('Invalid density supplied to computeDensityMass');
  }
  let sum = 0;
  const size = width * height;
  for (let i = 0; i < size; i++) {
    sum += data[i];
  }
  return sum * cellArea;
}

module.exports = { computeDensityMass };
