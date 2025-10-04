import fs from 'fs';
import path from 'path';

const DEFAULT_DATA_ROOT = path.resolve(process.cwd(), '..', '..', 'data', 'prism');

function resolveDataRoot(): string {
  return process.env.PRISM_DATA_DIR ?? DEFAULT_DATA_ROOT;
}

export function prismDataPath(...segments: string[]): string {
  const root = resolveDataRoot();
  return path.join(root, ...segments);
}

export function ensureParentDir(filePath: string): void {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
}

export function readJsonFile<T>(filePath: string, fallback: T): T {
  try {
    if (!fs.existsSync(filePath)) {
      return fallback;
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    if (!raw.trim()) {
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`[prismData] Failed to read ${filePath}:`, err);
    return fallback;
  }
}

export function writeJsonFile(filePath: string, data: unknown): void {
  ensureParentDir(filePath);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}
