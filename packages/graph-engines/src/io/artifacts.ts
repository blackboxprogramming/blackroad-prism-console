import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { ArtifactReference } from '../types';

export interface ArtifactOptions {
  baseDir?: string;
}

const DEFAULT_BASE = path.join(process.cwd(), 'artifacts');

export function ensureBase(baseDir = DEFAULT_BASE) {
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
  }
}

export function writeTextArtifact(
  filename: string,
  content: string,
  description: string,
  type: ArtifactReference['type'],
  options: ArtifactOptions = {}
): ArtifactReference {
  const baseDir = options.baseDir ?? DEFAULT_BASE;
  ensureBase(baseDir);
  const filePath = path.join(baseDir, filename);
  fs.writeFileSync(filePath, content, 'utf8');
  const sha256 = crypto.createHash('sha256').update(content).digest('hex');
  return {
    id: sha256.slice(0, 12),
    type,
    path: filePath,
    sha256,
    description
  };
}

export function writeBinaryArtifact(
  filename: string,
  buffer: Buffer,
  description: string,
  type: ArtifactReference['type'],
  options: ArtifactOptions = {}
): ArtifactReference {
  const baseDir = options.baseDir ?? DEFAULT_BASE;
  ensureBase(baseDir);
  const filePath = path.join(baseDir, filename);
  fs.writeFileSync(filePath, buffer);
  const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
  return {
    id: sha256.slice(0, 12),
    type,
    path: filePath,
    sha256,
    description
  };
}
