import { readFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { spectralEmbedding } from '@blackroad/graph-engines/spectral/embed';
import { writeSpectralArtifacts } from '@blackroad/graph-engines/io/artifacts';
import { GraphData } from '@blackroad/graph-engines/types';
import { TelemetryHandle, endTelemetry } from '../../lib/telemetry';
import { assertCapability } from '../../lib/auth';
import { loadConfig } from '../../lib/config';

interface GraphEmbedOptions {
  edgeList: string;
  k: number;
  seed: number;
  outDir: string;
  telemetry: TelemetryHandle;
}

function parseEdgeList(edgeList: string): GraphData {
  const lines = edgeList
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const edges = lines.map((line) => {
    const parts = line.split(/\s+/);
    if (parts.length < 2) {
      throw new Error(`invalid edge '${line}'`);
    }
    return { source: Number(parts[0]), target: Number(parts[1]) };
  });
  const nodes = edges.reduce((max, edge) => Math.max(max, edge.source, edge.target), 0) + 1;
  return { nodes, edges };
}

export async function runGraphEmbed(options: GraphEmbedOptions) {
  const config = loadConfig();
  assertCapability(config, 'graph:spectral');
  try {
    const edgeListPath = resolve(process.cwd(), options.edgeList);
    const edgeList = readFileSync(edgeListPath, 'utf8');
    const graph = parseEdgeList(edgeList);
    const result = spectralEmbedding(graph, { k: options.k, seed: options.seed });
    mkdirSync(options.outDir, { recursive: true });
    writeSpectralArtifacts(result, { directory: options.outDir });
    console.log(`[graph] spectral embedding complete: ${options.outDir}`);
  } finally {
    endTelemetry(options.telemetry);
  }
}
