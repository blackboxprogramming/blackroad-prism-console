import { spectralEmbedding } from '../src/spectral/embed';
import { GraphData } from '../src/types';
import fs from 'node:fs';
import path from 'node:path';

describe('spectral embedding', () => {
  const artifactDir = path.join(__dirname, 'tmp');
  beforeAll(() => {
    if (!fs.existsSync(artifactDir)) {
      fs.mkdirSync(artifactDir, { recursive: true });
    }
  });
  afterAll(() => {
    fs.rmSync(artifactDir, { recursive: true, force: true });
  });

  it('computes eigenpairs and deterministic artifacts', () => {
    const graph: GraphData = {
      nodeCount: 6,
      edges: [
        { source: 0, target: 1 },
        { source: 1, target: 2 },
        { source: 2, target: 3 },
        { source: 3, target: 4 },
        { source: 4, target: 5 },
        { source: 5, target: 0 },
        { source: 0, target: 3 }
      ]
    };
    const result = spectralEmbedding(graph, { k: 3, artifactDir });
    expect(result.eigenvalues.length).toBe(3);
    expect(result.metrics.eigengap.length).toBe(3);
    expect(result.metrics.conductance.length).toBeGreaterThan(0);
    const plotPath = result.artifacts.find((artifact) => artifact.path.endsWith('spectral_embedding.png'));
    expect(plotPath).toBeDefined();
    const golden = fs.readFileSync(path.join(__dirname, 'golden', 'graph_small.embedding.png.golden'), 'utf8');
    const produced = fs.readFileSync(plotPath!.path, 'utf8');
    expect(produced).toBe(golden);
  });
});
