import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { deflateSync } from 'zlib';
import { ArtifactContext, ArtifactRecord } from '../types';

function ensureDir(path: string) {
  mkdirSync(path, { recursive: true });
}

function writeCurvatureCsv(context: ArtifactContext): ArtifactRecord {
  ensureDir(context.directory);
  const rows = Array.from(context.curvature.values.entries()).map(([edgeId, value]) => `${edgeId},${value.toFixed(6)}`);
  const csv = ['edge_id,curvature', ...rows, ''].join('\n');
  const path = join(context.directory, 'curvature.csv');
  writeFileSync(path, csv);
  return { path, description: 'Edge curvature values' };
}

function writeWeightsCsv(context: ArtifactContext): ArtifactRecord {
  ensureDir(context.directory);
  const rows = context.graph.edges.map((edge) => {
    const weight = context.weights.get(edge.id) ?? edge.weight;
    return `${edge.id},${edge.source},${edge.target},${weight.toFixed(6)}`;
  });
  const csv = ['edge_id,source,target,weight', ...rows, ''].join('\n');
  const path = join(context.directory, 'weights.csv');
  writeFileSync(path, csv);
  return { path, description: 'Ricci-flowed edge weights' };
}

function writeStressHistory(context: ArtifactContext): ArtifactRecord {
  ensureDir(context.directory);
  const payload = context.stressHistory.map((point) => ({ iteration: point.iteration, stress: Number(point.stress.toFixed(6)) }));
  const path = join(context.directory, 'stress.json');
  writeFileSync(path, JSON.stringify({ history: payload }, null, 2));
  return { path, description: 'Stress per iteration' };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function curvatureToColor(value: number, min: number, max: number): [number, number, number] {
  if (value >= 0) {
    const scale = max > 0 ? value / max : 0;
    return [Math.round(lerp(180, 255, scale)), Math.round(lerp(64, 200, scale)), Math.round(lerp(90, 120, 1 - scale))];
  }
  const scale = min < 0 ? value / min : 0;
  return [Math.round(lerp(40, 90, 1 - scale)), Math.round(lerp(90, 140, 1 - scale)), Math.round(lerp(200, 255, scale))];
}

function drawNode(pixels: Uint8Array, width: number, height: number, x: number, y: number, radius: number, color: [number, number, number]) {
  for (let dy = -radius; dy <= radius; dy += 1) {
    for (let dx = -radius; dx <= radius; dx += 1) {
      if (dx * dx + dy * dy > radius * radius) {
        continue;
      }
      const px = Math.min(width - 1, Math.max(0, x + dx));
      const py = Math.min(height - 1, Math.max(0, y + dy));
      const idx = (py * width + px) * 4;
      pixels[idx] = color[0];
      pixels[idx + 1] = color[1];
      pixels[idx + 2] = color[2];
      pixels[idx + 3] = 255;
    }
  }
}

function createPng(width: number, height: number, pixels: Uint8Array): Buffer {
  const raw = Buffer.alloc(height * (width * 4 + 1));
  for (let y = 0; y < height; y += 1) {
    const rowStart = y * (width * 4 + 1);
    raw[rowStart] = 0;
    const srcStart = y * width * 4;
    for (let x = 0; x < width * 4; x += 1) {
      raw[rowStart + 1 + x] = pixels[srcStart + x];
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // bit depth
  header[9] = 6; // color type RGBA
  header[10] = 0; // compression
  header[11] = 0; // filter
  header[12] = 0; // interlace
  const chunks = [createChunk('IHDR', header), createChunk('IDAT', deflateSync(raw)), createChunk('IEND', Buffer.alloc(0))];
  return Buffer.concat([PNG_SIGNATURE, ...chunks]);
}

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      if (c & 1) {
        c = 0xedb88320 ^ (c >>> 1);
      } else {
        c >>>= 1;
      }
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buffer: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i += 1) {
    const byte = buffer[i];
    const index = (crc ^ byte) & 0xff;
    crc = CRC_TABLE[index] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createChunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeBuffer = Buffer.from(type, 'ascii');
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

function writeLayoutPng(context: ArtifactContext): ArtifactRecord {
  ensureDir(context.directory);
  const width = 256;
  const height = 256;
  const pixels = new Uint8Array(width * height * 4);
  pixels.fill(18);
  for (let i = 3; i < pixels.length; i += 4) {
    pixels[i] = 255;
  }
  const nodeCurvature = new Array(context.graph.nodeCount).fill(0);
  const counts = new Array(context.graph.nodeCount).fill(0);
  for (const edge of context.graph.edges) {
    const value = context.curvature.values.get(edge.id) ?? 0;
    nodeCurvature[edge.source] += value;
    nodeCurvature[edge.target] += value;
    counts[edge.source] += 1;
    counts[edge.target] += 1;
  }
  for (let i = 0; i < nodeCurvature.length; i += 1) {
    if (counts[i] > 0) {
      nodeCurvature[i] /= counts[i];
    }
  }
  const min = Math.min(...nodeCurvature);
  const max = Math.max(...nodeCurvature);
  const xs = context.embedding.map((point) => point[0]);
  const ys = context.embedding.map((point) => point[1] ?? 0);
  const minX = Math.min(...xs, -1e-6);
  const maxX = Math.max(...xs, 1e-6);
  const minY = Math.min(...ys, -1e-6);
  const maxY = Math.max(...ys, 1e-6);
  for (let i = 0; i < context.embedding.length; i += 1) {
    const point = context.embedding[i];
    const color = curvatureToColor(nodeCurvature[i], min, max);
    const nx = (point[0] - minX) / (maxX - minX || 1);
    const ny = (point[1] - minY) / (maxY - minY || 1);
    const x = Math.round(16 + nx * (width - 32));
    const y = Math.round(16 + ny * (height - 32));
    drawNode(pixels, width, height, x, height - y, 4, color);
  }
  const buffer = createPng(width, height, pixels);
  const path = join(context.directory, 'layout.png');
  writeFileSync(path, buffer);
  return { path, description: 'Layout heatmap (curvature-coded)' };
}

function writeFlowVideo(context: ArtifactContext): ArtifactRecord {
  ensureDir(context.directory);
  const path = join(context.directory, 'flow.webm');
  const manifest = context.stressHistory.map((point) => ({ iteration: point.iteration, stress: point.stress }));
  writeFileSync(path, Buffer.from(JSON.stringify({ frames: manifest }), 'utf8'));
  return { path, description: 'Flow placeholder video (JSON encoded)' };
}

export function writeRicciArtifacts(context: ArtifactContext): ArtifactRecord[] {
  const artifacts: ArtifactRecord[] = [];
  artifacts.push(writeCurvatureCsv(context));
  artifacts.push(writeWeightsCsv(context));
  artifacts.push(writeStressHistory(context));
  artifacts.push(writeLayoutPng(context));
  artifacts.push(writeFlowVideo(context));
  return artifacts;
}
