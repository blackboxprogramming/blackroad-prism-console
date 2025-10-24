import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { ArtifactRecord, DensityField, PhaseField, SpectralEmbedding } from '../types';

export interface ArtifactOptions {
  directory: string;
}

function ensureDir(path: string) {
  mkdirSync(path, { recursive: true });
}

export function writeSpectralArtifacts(result: SpectralEmbedding, options: ArtifactOptions): ArtifactRecord[] {
  ensureDir(options.directory);
  const artifacts: ArtifactRecord[] = [];
  const embeddingCsv = result.embedding
    .map((row, idx) => [idx, ...row, result.clusters[idx]].join(','))
    .join('\n');
  const csvPath = join(options.directory, 'spectral_embedding.csv');
  writeFileSync(csvPath, `node,x0,x1,x2,cluster\n${embeddingCsv}\n`);
  artifacts.push({ path: csvPath, description: 'Spectral embedding coordinates' });

  const eigenJsonPath = join(options.directory, 'spectral_eigenvalues.json');
  writeFileSync(eigenJsonPath, JSON.stringify(result.eigenvalues, null, 2));
  artifacts.push({ path: eigenJsonPath, description: 'Eigenvalues' });

  return artifacts;
}

export function writeDensityArtifact(field: DensityField, options: ArtifactOptions): ArtifactRecord {
  ensureDir(options.directory);
  const path = join(options.directory, 'density.json');
  writeFileSync(path, JSON.stringify({ width: field.width, height: field.height, values: field.values }, null, 2));
  return { path, description: 'Density field' };
}

export function writePhaseFieldArtifact(field: PhaseField, options: ArtifactOptions): ArtifactRecord {
  ensureDir(options.directory);
  const path = join(options.directory, 'phase_field.json');
  writeFileSync(path, JSON.stringify({ width: field.width, height: field.height, values: field.values }, null, 2));
  return { path, description: 'Phase field snapshot' };
}
