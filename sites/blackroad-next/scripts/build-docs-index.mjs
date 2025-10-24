import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import matter from "gray-matter";

const CONTENT_ROOT = join(process.cwd(), "content", "docs");
const OUT_DIR = join(process.cwd(), "public");
const OUT_FILE = join(OUT_DIR, "docs.index.json");

function walkDocs(dir) {
  const entries = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const filePath = join(dir, entry.name);
    if (entry.isDirectory()) {
      entries.push(...walkDocs(filePath));
      continue;
    }
    if (!entry.name.endsWith(".md")) continue;
    const relativePath = filePath.replace(`${CONTENT_ROOT}/`, "");
    const slug = relativePath.replace(/\.md$/, "").toLowerCase();
    const raw = readFileSync(filePath, "utf-8");
    const { content } = matter(raw);
    const title = (content.match(/^#\s+(.+)/m) ?? ["", "Untitled"])[1].trim();
    entries.push({ slug, title, path: relativePath });
  }
  return entries;
}

const docs = existsSync(CONTENT_ROOT) ? walkDocs(CONTENT_ROOT) : [];
mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT_FILE, JSON.stringify({ docs, changelog: [] }, null, 2));
console.log(`[docs] indexed ${docs.length} docs`);
