import fs from 'fs';
import path from 'path';

const DEFAULT_SSM_ROOT = path.resolve(process.cwd(), '..', '..', 'data', 'ssm');

function resolveSsmRoot(): string {
  return process.env.SSM_MOCK_DIR ?? DEFAULT_SSM_ROOT;
}

function normaliseName(name: string): string {
  return name.replace(/^\/+/, '');
}

export async function putSecureParameter(name: string, value: string): Promise<void> {
  const normalised = normaliseName(name);
  const fullPath = path.join(resolveSsmRoot(), normalised);
  await fs.promises.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.promises.writeFile(fullPath, value, { encoding: 'utf-8' });
}

export async function getSecureParameter(name: string): Promise<string | null> {
  const normalised = normaliseName(name);
  const fullPath = path.join(resolveSsmRoot(), normalised);
  try {
    const raw = await fs.promises.readFile(fullPath, 'utf-8');
    return raw;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    throw err;
  }
}
