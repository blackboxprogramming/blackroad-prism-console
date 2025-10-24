import fs from 'fs';
import path from 'path';
import { solveWeights, rasterizePowerDiagram, buildDynamicInterpolation } from '@blackroad/ot-engine';
import { configureTelemetry } from '../../lib/telemetry';

export type OtSolveOptions = {
  kind: 'semidiscrete' | 'dynamic';
  source: string;
  target?: string;
  steps?: number;
  out?: string;
};

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadJson(filePath: string) {
  const abs = path.resolve(filePath);
  const raw = fs.readFileSync(abs, 'utf8');
  return JSON.parse(raw);
}

function loadDensity(filePath: string) {
  const payload = loadJson(filePath);
  const { width, height, data } = payload;
  if (typeof width !== 'number' || typeof height !== 'number' || !Array.isArray(data)) {
    throw new Error('Density JSON must include width, height, and data array');
  }
  return { width, height, data: Float64Array.from(data), cellArea: payload.cellArea ?? 1 };
}

function writeJson(outDir: string, name: string, value: unknown) {
  const filePath = path.join(outDir, name);
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
  return filePath;
}

function asciiOwner(owner: Uint32Array, width: number, height: number) {
  const rows: string[] = [];
  for (let y = 0; y < height; y++) {
    let row = '';
    for (let x = 0; x < width; x++) {
      row += owner[y * width + x].toString(16);
    }
    rows.push(row);
  }
  return rows.join('\n');
}

export async function runOtSolve(options: OtSolveOptions) {
  const telemetry = configureTelemetry(`ot.solve.${options.kind}`);
  const outDir = path.resolve(options.out ?? 'artifacts/ot');
  ensureDir(outDir);
  if (options.kind === 'semidiscrete') {
    if (!options.target) {
      throw new Error('semidiscrete solve requires --target pointing to sites JSON');
    }
    const density = loadDensity(options.source);
    const targetPayload = loadJson(options.target);
    if (!Array.isArray(targetPayload.sites)) {
      throw new Error('sites JSON must include a sites array');
    }
    const sites = targetPayload.sites.map((site: any) => ({ x: Number(site.x), y: Number(site.y) }));
    const masses = Array.isArray(targetPayload.masses)
      ? targetPayload.masses.map((m: any) => Number(m))
      : sites.map(() => (1 / sites.length));
    const result = solveWeights({ density, sites, targetMasses: masses, options: { tolerance: 0.01 } });
    const owner = rasterizePowerDiagram(sites, Array.from(result.weights), density, { includeMass: false }).owner;
    const ascii = asciiOwner(owner, density.width, density.height);
    fs.writeFileSync(path.join(outDir, 'laguerre.txt'), ascii, 'utf8');
    const summary = {
      kind: 'semidiscrete',
      masses: Array.from(result.masses),
      iterations: result.iterations,
      converged: result.converged,
      outDir,
    };
    writeJson(outDir, 'job.json', summary);
    telemetry.span.finish();
    // eslint-disable-next-line no-console
    console.log('Semi-discrete solve complete. Results saved to', outDir);
  } else {
    const steps = options.steps ?? 8;
    const rho0 = loadDensity(options.source);
    if (!options.target) {
      throw new Error('dynamic solve requires --target pointing to target density JSON');
    }
    const rho1 = loadDensity(options.target);
    const result = buildDynamicInterpolation({ rho0, rho1, steps });
    writeJson(outDir, 'frames.json', {
      steps,
      totalCost: result.totalCost,
      continuityResidual: result.continuityResidual,
      frames: result.frames.map((frame) => ({
        width: frame.width,
        height: frame.height,
        data: Array.from(frame.data),
      })),
    });
    writeJson(outDir, 'job.json', {
      kind: 'dynamic',
      steps,
      totalCost: result.totalCost,
      continuityResidual: result.continuityResidual,
      outDir,
    });
    telemetry.span.finish();
    // eslint-disable-next-line no-console
    console.log('Dynamic solve complete. Results saved to', outDir);
  }
}
