import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import test from 'node:test';

const buttonPath = fileURLToPath(new URL('../src/components/Button.tsx', import.meta.url));
const src = readFileSync(buttonPath, 'utf8');

test('positive button uses gold 40pt spec', () => {
  assert(src.includes("positive"));
  assert(src.includes("--accent-3"));
  assert(src.includes("h-[40pt]"));
});
