import fs from 'node:fs';
import path from 'node:path';

const FIXTURES_DIR = path.join(process.cwd(), 'mocks', 'fixtures');

export function readFixture<T>(filename: string): T {
  const file = path.join(FIXTURES_DIR, filename);
  const contents = fs.readFileSync(file, 'utf-8');
  return JSON.parse(contents) as T;
}

export function writeFixture<T>(filename: string, value: T) {
  const file = path.join(FIXTURES_DIR, filename);
  fs.writeFileSync(file, JSON.stringify(value, null, 2));
}
