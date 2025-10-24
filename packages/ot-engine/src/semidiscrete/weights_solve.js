const { rasterizePowerDiagram } = require('./power_cells');
const { computeDensityMass } = require('./raster_mass');

function relativeError(mass, target) {
  if (Math.abs(target) < 1e-9) {
    return Math.abs(mass);
  }
  return Math.abs((mass - target) / target);
}

function evaluateMasses(sites, weights, density, weightScale, supersample) {
  return rasterizePowerDiagram(sites, Array.from(weights), density, {
    includeMass: true,
    weightScale,
    supersample,
  });
}

/**
 * Semi-discrete weight solve using coordinate-wise bisection.
 */
function solveWeights(params) {
  const { density, sites, targetMasses, options = {} } = params;
  if (!density || !sites || !targetMasses) {
    throw new Error('density, sites and targetMasses are required');
  }
  if (sites.length !== targetMasses.length) {
    throw new Error('sites and targetMasses must have the same length');
  }
  const totalTarget = targetMasses.reduce((acc, v) => acc + v, 0);
  const densityMass = computeDensityMass(density);
  const scale = densityMass > 0 ? totalTarget / densityMass : 1;
  const normalizedTargets = targetMasses.map((m) => m / (scale || 1));

  const maxIterations = options.maxIterations ?? 48;
  const tolerance = options.tolerance ?? 0.01;
  const weightScale = options.weightScale ?? density.width * density.height;
  const supersample = options.supersample ?? 4;
  const weights = new Float64Array(sites.length);

  let result = evaluateMasses(sites, weights, density, weightScale, supersample);

  for (let iter = 0; iter < maxIterations; iter++) {
    const maxRel = Math.max(
      ...result.masses.map((m, idx) => relativeError(m, normalizedTargets[idx]))
    );
    if (maxRel <= tolerance) {
      return {
        weights,
        masses: result.masses,
        areas: result.areas,
        owner: result.owner,
        iterations: iter + 1,
        converged: true,
      };
    }

    for (let i = 0; i < sites.length; i++) {
      const target = normalizedTargets[i];
      let low = weights[i] - 1;
      let high = weights[i] + 1;
      let lowMass = evaluateMassesWithCache(sites, weights, density, weightScale, supersample, i, low).masses[i];
      let highMass = evaluateMassesWithCache(sites, weights, density, weightScale, supersample, i, high).masses[i];
      let expand = 2;
      if (lowMass > highMass) {
        const tmp = low; low = high; high = tmp;
        const tmpMass = lowMass; lowMass = highMass; highMass = tmpMass;
      }
      while (target < lowMass) {
        high = low;
        highMass = lowMass;
        low -= expand;
        const evalLow = evaluateMassesWithCache(sites, weights, density, weightScale, supersample, i, low);
        lowMass = evalLow.masses[i];
        expand *= 2;
      }
      while (target > highMass) {
        low = high;
        lowMass = highMass;
        high += expand;
        const evalHigh = evaluateMassesWithCache(sites, weights, density, weightScale, supersample, i, high);
        highMass = evalHigh.masses[i];
        expand *= 2;
      }
      let chosen = weights[i];
      let chosenResult = result;
      for (let b = 0; b < 24; b++) {
        const mid = 0.5 * (low + high);
        const evalMid = evaluateMassesWithCache(sites, weights, density, weightScale, supersample, i, mid);
        const mass = evalMid.masses[i];
        if (Math.abs(mass - target) < Math.abs(chosenResult.masses[i] - target)) {
          chosen = mid;
          chosenResult = evalMid;
        }
        if (mass > target) {
          high = mid;
          highMass = mass;
        } else {
          low = mid;
          lowMass = mass;
        }
      }
      weights[i] = chosen;
      result = chosenResult;
    }
  }

  return {
    weights,
    masses: result.masses,
    areas: result.areas,
    owner: result.owner,
    iterations: maxIterations,
    converged: false,
  };
}

function evaluateMassesWithCache(sites, weights, density, weightScale, supersample, idx, value) {
  const tempWeights = Array.from(weights);
  tempWeights[idx] = value;
  return rasterizePowerDiagram(sites, tempWeights, density, {
    includeMass: true,
    weightScale,
    supersample,
  });
}

module.exports = { solveWeights };
