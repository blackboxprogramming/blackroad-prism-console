import { parsePatch } from 'diff';
import { globby } from 'globby';
import fs from 'fs';
import path from 'path';
import { DiffIntel, PrismDiff, TestPrediction } from '../types';

const jsFuncRegex = /(?:function|const|class|export function)\s+([A-Za-z_][A-Za-z0-9_]*)/g;
const pyFuncRegex = /(?:def|class)\s+([A-Za-z_][A-Za-z0-9_]*)/g;

function extractFunctions(ext: string, content: string): string[] {
  const regex = ext === '.py' ? pyFuncRegex : jsFuncRegex;
  const names = new Set<string>();
  let m;
  while ((m = regex.exec(content))) {
    names.add(m[1]);
  }
  return [...names];
}

async function predictTests(filePath: string, root: string): Promise<TestPrediction[]> {
  const predictions: TestPrediction[] = [];
  const ext = path.extname(filePath);
  const rel = filePath;
  if (['.ts', '.js', '.tsx', '.jsx'].includes(ext)) {
    const base = rel.replace(/\.(tsx|jsx|ts|js)$/, '');
    const candidates = [
      `${base}.test${ext}`,
      `${base}.spec${ext}`,
      base.replace(/^src\//, 'src/__tests__/') + `.test${ext}`,
      base.replace(/^src\//, 'src/__tests__/') + `.spec${ext}`
    ];
    for (const c of candidates) {
      const abs = path.join(root, c);
      if (fs.existsSync(abs)) {
        predictions.push({ file: c, reason: 'neighbor test', weight: 1 });
      }
    }
  } else if (ext === '.py') {
    const fileName = path.basename(rel, '.py');
    const candidates = [
      `tests/test_${fileName}.py`,
      `${path.dirname(rel)}/test_${fileName}.py`
    ];
    for (const c of candidates) {
      const abs = path.join(root, c);
      if (fs.existsSync(abs)) {
        predictions.push({ file: c, reason: 'mapped test', weight: 1 });
      }
    }
  }
  return predictions.slice(0, 10);
}

export async function computeDiffIntel(diffs: PrismDiff[], root: string): Promise<DiffIntel[]> {
  const result: DiffIntel[] = [];
  for (const d of diffs) {
    const parsed = parsePatch(d.patch);
    let added = 0;
    let removed = 0;
    parsed.forEach(h => {
      h.hunks.forEach(hunk => {
        hunk.lines.forEach(l => {
          if (l.startsWith('+') && !l.startsWith('+++')) added++;
          if (l.startsWith('-') && !l.startsWith('---')) removed++;
        });
      });
    });
    const functionsChanged = extractFunctions(path.extname(d.path), d.patch);
    const testsPredicted = await predictTests(d.path, root);
    const summary = `Added ${added} lines, removed ${removed}`;
    result.push({ path: d.path, summary, functionsChanged, testsPredicted });
  }
  return result;
}
