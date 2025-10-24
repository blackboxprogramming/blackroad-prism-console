import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import JSZip from 'jszip';
import { PNG } from 'pngjs';
import { ArtifactPaths, Diagnostics } from '../types.js';
import { Frame } from '../interpolate.js';

interface ArtifactInput {
  directory: string;
  coupling: Float64Array;
  rows: number;
  cols: number;
  barycentric: number[][];
  diagnostics: Diagnostics;
  frames: Frame[];
}

function ensureDirectory(dir: string) {
  return mkdir(dir, { recursive: true });
}

function createNpyBuffer(data: Float64Array, shape: number[]): Buffer {
  const magic = Buffer.from([0x93, 0x4e, 0x55, 0x4d, 0x50, 0x59]); // \x93NUMPY
  const version = Buffer.from([0x01, 0x00]);
  const shapeStr = `(${shape.join(', ')}${shape.length === 1 ? ',' : ''})`;
  let header = `{ 'descr': '<f8', 'fortran_order': False, 'shape': ${shapeStr}, }`;
  const baseLen = magic.length + version.length + 2; // header length field
  const padding = (16 - ((baseLen + header.length + 1) % 16)) % 16;
  header += ' '.repeat(padding) + '\n';
  const headerBuffer = Buffer.from(header, 'latin1');
  const headerLen = Buffer.alloc(2);
  headerLen.writeUInt16LE(headerBuffer.length, 0);

  const body = Buffer.alloc(data.length * 8);
  for (let i = 0; i < data.length; i += 1) {
    body.writeDoubleLE(data[i], i * 8);
  }

  return Buffer.concat([magic, version, headerLen, headerBuffer, body]);
}

async function writeNpz(directory: string, name: string, data: Float64Array, rows: number, cols: number) {
  const zip = new JSZip();
  const npy = createNpyBuffer(data, [rows, cols]);
  zip.file('array.npy', npy);
  const content = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  await writeFile(path.join(directory, name), content);
}

async function writeMapPng(directory: string, name: string, barycentric: number[][]) {
  const height = barycentric.length;
  const width = barycentric[0]?.length ?? 1;
  const png = new PNG({ width, height });
  let maxVal = 0;
  for (const row of barycentric) {
    for (const value of row) {
      if (value > maxVal) {
        maxVal = value;
      }
    }
  }
  const scale = maxVal > 0 ? 255 / maxVal : 1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const value = Math.max(0, Math.min(255, Math.round(barycentric[y][x] * scale)));
      const idx = (y * width + x) * 4;
      png.data[idx] = value;
      png.data[idx + 1] = value;
      png.data[idx + 2] = Math.min(255, Math.round(255 - value / 2));
      png.data[idx + 3] = 255;
    }
  }
  await writeFile(path.join(directory, name), PNG.sync.write(png));
}

async function writeDiagnostics(directory: string, name: string, diagnostics: Diagnostics) {
  await writeFile(path.join(directory, name), JSON.stringify(diagnostics, null, 2), 'utf8');
}

async function writeFrames(directory: string, name: string, frames: Frame[]) {
  const payload = {
    format: 'sb.frames',
    version: 1,
    frames
  };
  await writeFile(path.join(directory, name), JSON.stringify(payload));
}

export async function writeArtifacts(input: ArtifactInput): Promise<ArtifactPaths> {
  const directory = path.resolve(input.directory);
  await ensureDirectory(directory);
  const piName = 'pi.npz';
  const mapName = 'map.png';
  const diagnosticsName = 'diagnostics.json';
  const framesName = 'frames.webm';

  await writeNpz(directory, piName, input.coupling, input.rows, input.cols);
  await writeMapPng(directory, mapName, input.barycentric);
  await writeDiagnostics(directory, diagnosticsName, input.diagnostics);
  await writeFrames(directory, framesName, input.frames);

  return {
    directory,
    piPath: path.join(directory, piName),
    mapPath: path.join(directory, mapName),
    diagnosticsPath: path.join(directory, diagnosticsName),
    framesPath: path.join(directory, framesName)
  };
}
