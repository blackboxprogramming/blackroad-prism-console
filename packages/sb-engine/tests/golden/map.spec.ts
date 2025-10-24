import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';
import { writeArtifacts } from '../src/io/artifacts.js';
import { barycentric } from '../src/barycentric.js';
import { computeDiagnostics } from '../src/sinkhorn/diagnostics.js';
import { Frame } from '../src/interpolate.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('artifact goldens', () => {
  it('writes deterministic map png for reference coupling', async () => {
    const coupling = Float64Array.from([0.35, 0.15, 0.1, 0.4]);
    const rows = 2;
    const cols = 2;
    const mu = Float64Array.from([0.5, 0.5]);
    const nu = Float64Array.from([0.45, 0.55]);
    const cost = Float64Array.from([1, 2, 3, 4]);
    const targets = [
      [-1, 0],
      [1, 2]
    ];
    const bary = barycentric(coupling, targets, { rows, cols });
    const diagnostics = computeDiagnostics({
      coupling,
      cost,
      mu,
      nu,
      epsilon: 0.5
    });
    const frames: Frame[] = [
      { t: 0, positions: [[-1, 0], [1, 2]] },
      { t: 1, positions: bary.map }
    ];

    const tmp = path.join(process.cwd(), 'packages', 'sb-engine', 'tests', 'tmp');
    await fs.rm(tmp, { recursive: true, force: true });
    await writeArtifacts({
      directory: tmp,
      coupling,
      rows,
      cols,
      barycentric: bary.map,
      diagnostics,
      frames
    });

    const mapBuffer = await fs.readFile(path.join(tmp, 'map.png'));
    const png = PNG.sync.read(mapBuffer);
    const goldenPath = path.join(__dirname, 'golden', 'two_gaussians.map.png.golden');
    const golden = JSON.parse(await fs.readFile(goldenPath, 'utf8')) as {
      width: number;
      height: number;
      rgba: number[][][];
    };

    expect(png.width).toBe(golden.width);
    expect(png.height).toBe(golden.height);

    for (let y = 0; y < png.height; y += 1) {
      for (let x = 0; x < png.width; x += 1) {
        const idx = (y * png.width + x) * 4;
        const pixel = [png.data[idx], png.data[idx + 1], png.data[idx + 2], png.data[idx + 3]];
        expect(pixel).toEqual(golden.rgba[y][x]);
      }
    }
  });
});
