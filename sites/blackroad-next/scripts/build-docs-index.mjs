import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import matter from "gray-matter";

const ROOT = join(process.cwd(), "content", "docs");
const OUT_DIR = join(process.cwd(), "public");
const OUT = join(OUT_DIR, "docs.index.json");

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walk(p));
    } else if (entry.name.endsWith(".md")) {
      const rel = p.replace(ROOT + "/", "");
      const slug = rel.replace(/\.md$/, "").toLowerCase();
      const raw = readFileSync(p, "utf-8");
      const { content } = matter(raw);
      const title = (content.match(/^#\s+(.+)/m) || ["", "Untitled"])[1].trim();
      out.push({ slug, title, path: rel });
    }
  }
  return out;
}

const docs = existsSync(ROOT) ? walk(ROOT) : [];
let changelog = [];
try {
  const BLOG = join(process.cwd(), "public", "blog", "index.json");
  void BLOG;
  changelog = [];
} catch {}

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT, JSON.stringify({ docs, changelog }, null, 2));
console.log(`[docs] indexed ${docs.length} docs`);
import { readdirSync, writeFileSync } from "fs";
import { join, relative } from "path";

const DOCS_DIR = join(process.cwd(), "public", "docs");
const INDEX_FILE = join(DOCS_DIR, "index.json");

function listFiles(dir, base) {
  const entries = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      entries.push(...listFiles(full, base));
    } else {
      entries.push({ path: relative(base, full).replace(/\\/g, "/") });
    }
  }
  return entries;
}

try {
  const files = listFiles(DOCS_DIR, DOCS_DIR);
  writeFileSync(INDEX_FILE, JSON.stringify({ files }, null, 2));
  console.log("[docs] built docs index");
} catch {
  // ok if docs directory missing
}
