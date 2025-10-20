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
