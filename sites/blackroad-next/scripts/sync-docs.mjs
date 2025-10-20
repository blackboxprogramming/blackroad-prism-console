// Copies ../../docs/*.md into ./content/docs so Vercel bundles them
import { mkdirSync, readdirSync, readFileSync, writeFileSync, statSync } from "fs";
import { join } from "path";

const SRC = join(process.cwd(), "..", "..", "docs");
const DEST = join(process.cwd(), "content", "docs");

mkdirSync(DEST, { recursive: true });

function copyDir(src, dest) {
  for (const name of readdirSync(src)) {
    const s = join(src, name);
    const d = join(dest, name);
    if (statSync(s).isDirectory()) {
      mkdirSync(d, { recursive: true });
      copyDir(s, d);
    } else if (name.endsWith(".md")) {
      writeFileSync(d, readFileSync(s));
    }
  }
}

copyDir(SRC, DEST);
console.log("[docs] synced to content/docs");
