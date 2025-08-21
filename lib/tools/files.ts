import fs from "node:fs";
import path from "node:path";

const ROOT = path.join(process.cwd(), "data", "knowledge");

function* walk(dir: string): Generator<string> {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(full);
    else if (/\.(md|txt)$/i.test(e.name)) yield full;
  }
}

export function searchFiles(query: string, limit = 4) {
  const q = tokenize(query);
  const docs: { file: string; text: string }[] = [];
  for (const f of walk(ROOT)) docs.push({ file: f, text: fs.readFileSync(f, "utf8") });

  // simple tf-idf
  const N = docs.length || 1;
  const df = new Map<string, number>();
  const docTokens = docs.map(d => {
    const toks = tokenize(d.text);
    const uniq = new Set(toks);
    uniq.forEach(t => df.set(t, (df.get(t) || 0) + 1));
    return { ...d, toks };
  });

  const scores = docTokens.map(d => {
    let score = 0;
    for (const t of q) {
      const tf = d.toks.filter(x => x === t).length;
      if (!tf) continue;
      const idf = Math.log((N + 1) / ((df.get(t) || 0) + 1)) + 1;
      score += tf * idf;
    }
    return { file: path.relative(ROOT, d.file), score, snippet: snippet(d.text, query) };
  });

  return scores.filter(s => s.score > 0).sort((a, b) => b.score - a.score).slice(0, limit);
}

export function readFile(relPath: string): string | null {
  const full = path.resolve(ROOT, relPath);
  if (!full.startsWith(ROOT)) return null;
  if (!fs.existsSync(full) || !fs.statSync(full).isFile()) return null;
  return fs.readFileSync(full, "utf8");
}

function tokenize(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9\s]+/g, " ").split(/\s+/).filter(Boolean);
}

function snippet(text: string, query: string) {
  const i = text.toLowerCase().indexOf(query.toLowerCase());
  const start = Math.max(0, i - 120);
  const end = Math.min(text.length, i + 120);
  return (i >= 0 ? text.slice(start, end) : text.slice(0, 240)).replace(/\s+/g, " ").trim();
}
