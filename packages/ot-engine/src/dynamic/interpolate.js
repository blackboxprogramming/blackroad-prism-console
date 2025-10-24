const { createScalarField, cloneField } = require('./grids');

function solvePoissonNeumann(rhs, iterations = 512, tolerance = 1e-6) {
  const { width, height, data } = rhs;
  const phi = new Float64Array(width * height);
  const tmp = new Float64Array(width * height);
  const inv4 = 0.25;
  let maxDiff = Infinity;
  let iter = 0;
  while (iter < iterations && maxDiff > tolerance) {
    maxDiff = 0;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const left = x > 0 ? phi[idx - 1] : phi[idx];
        const right = x < width - 1 ? phi[idx + 1] : phi[idx];
        const up = y > 0 ? phi[idx - width] : phi[idx];
        const down = y < height - 1 ? phi[idx + width] : phi[idx];
        const next = inv4 * (left + right + up + down - data[idx]);
        maxDiff = Math.max(maxDiff, Math.abs(next - phi[idx]));
        tmp[idx] = next;
      }
    }
    phi.set(tmp);
    iter += 1;
  }
  return { width, height, data: phi, iterations: iter, residual: maxDiff };
}

function gradient(field) {
  const { width, height, data } = field;
  const gx = new Float64Array(width * height);
  const gy = new Float64Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const left = x > 0 ? data[idx - 1] : data[idx];
      const right = x < width - 1 ? data[idx + 1] : data[idx];
      const up = y > 0 ? data[idx - width] : data[idx];
      const down = y < height - 1 ? data[idx + width] : data[idx];
      gx[idx] = 0.5 * (right - left);
      gy[idx] = 0.5 * (down - up);
    }
  }
  return { width, height, gx, gy };
}

function divergence(vectorField) {
  const { width, height, mx, my } = vectorField;
  const div = new Float64Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const mxHere = mx[idx];
      const mxLeft = x > 0 ? mx[idx - 1] : 0;
      const myHere = my[idx];
      const myUp = y > 0 ? my[idx - width] : 0;
      div[idx] = (mxHere - mxLeft) + (myHere - myUp);
    }
  }
  return { width, height, data: div };
}

function linearInterpolation(rho0, rho1, steps) {
  const frames = [];
  for (let k = 0; k <= steps; k++) {
    const t = k / steps;
    const frame = createScalarField(rho0.width, rho0.height);
    for (let i = 0; i < frame.data.length; i++) {
      frame.data[i] = (1 - t) * rho0.data[i] + t * rho1.data[i];
    }
    frames.push(frame);
  }
  return frames;
}

function buildDynamicInterpolation({ rho0, rho1, steps = 8, options = {} }) {
  if (rho0.width !== rho1.width || rho0.height !== rho1.height) {
    throw new Error('rho0 and rho1 must have matching grid dimensions');
  }
  const eps = options.epsilon ?? 1e-8;
  const frames = linearInterpolation(rho0, rho1, steps);
  const flows = [];
  const costs = [];
  const residuals = [];
  const dt = 1 / steps;
  for (let k = 0; k < steps; k++) {
    const current = frames[k];
    const next = frames[k + 1];
    const deltaField = createScalarField(current.width, current.height);
    for (let i = 0; i < deltaField.data.length; i++) {
      deltaField.data[i] = (next.data[i] - current.data[i]) / dt;
    }
    const { data: rhs } = cloneField(deltaField);
    const poissonSolution = solvePoissonNeumann({ width: current.width, height: current.height, data: rhs }, options.poissonIterations, options.poissonTolerance);
    const grad = gradient(poissonSolution);
    const momentumX = new Float64Array(current.width * current.height);
    const momentumY = new Float64Array(current.width * current.height);
    const rhoAvg = new Float64Array(current.width * current.height);
    for (let i = 0; i < current.data.length; i++) {
      rhoAvg[i] = Math.max(eps, 0.5 * (current.data[i] + next.data[i]));
      momentumX[i] = -grad.gx[i];
      momentumY[i] = -grad.gy[i];
    }
    const velocityX = new Float64Array(current.width * current.height);
    const velocityY = new Float64Array(current.width * current.height);
    for (let i = 0; i < velocityX.length; i++) {
      velocityX[i] = momentumX[i] / rhoAvg[i];
      velocityY[i] = momentumY[i] / rhoAvg[i];
    }
    const div = divergence({ width: current.width, height: current.height, mx: rhoAvg.map((v, idx) => v * velocityX[idx]), my: rhoAvg.map((v, idx) => v * velocityY[idx]) });
    let resMax = 0;
    for (let i = 0; i < div.data.length; i++) {
      const cont = deltaField.data[i] + div.data[i];
      resMax = Math.max(resMax, Math.abs(cont));
    }
    residuals.push(resMax);
    let localCost = 0;
    for (let i = 0; i < rhoAvg.length; i++) {
      const mx = rhoAvg[i] * velocityX[i];
      const my = rhoAvg[i] * velocityY[i];
      localCost += (mx * mx + my * my) / Math.max(eps, rhoAvg[i]);
    }
    costs.push(0.5 * dt * localCost);
    flows.push({ width: current.width, height: current.height, vx: velocityX, vy: velocityY, rhoAvg });
  }
  const totalCost = costs.reduce((a, b) => a + b, 0);
  const continuityResidual = Math.max(...residuals);
  return {
    frames,
    flows,
    costs,
    totalCost,
    continuityResidual,
  };
}

module.exports = {
  buildDynamicInterpolation,
  solvePoissonNeumann,
  gradient,
  divergence,
};
