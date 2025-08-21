import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import { forbidFunctions } from '../../packages/lucidia-create/security/policy.js';

const DATA_DIR = new URL('./data/', import.meta.url);

export interface Schematic {
  version: string;
  nodes: unknown[];
  edges: unknown[];
  signature?: string;
}

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

export function hash(obj: unknown): string {
  const json = JSON.stringify(obj, Object.keys(obj as any).sort());
  return createHash('sha256').update(json).digest('hex');
}

export async function save(sch: Schematic) {
  forbidFunctions(sch);
  await ensureDir();
  const id = hash(sch);
  const file = new URL(`${id}.json`, DATA_DIR);
  await fs.writeFile(file, JSON.stringify({ ...sch, id }, null, 2), 'utf-8');
  return id;
}

export async function load(id: string): Promise<Schematic | null> {
  try {
    const file = new URL(`${id}.json`, DATA_DIR);
    const txt = await fs.readFile(file, 'utf-8');
    return JSON.parse(txt);
  } catch {
    return null;
  }
}
