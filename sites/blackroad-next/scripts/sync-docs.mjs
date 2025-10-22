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
import { mkdirSync, readdirSync, copyFileSync } from "fs";
import { join } from "path";

const SRC = join(process.cwd(), "..", "..", "sites", "blackroad", "public", "docs");
const DST = join(process.cwd(), "public", "docs");
mkdirSync(DST, { recursive: true });

function cpdir(src, dst) {
  for (const e of readdirSync(src, { withFileTypes: true })) {
    const s = join(src, e.name);
    const d = join(dst, e.name);
    if (e.isDirectory()) {
      mkdirSync(d, { recursive: true });
      cpdir(s, d);
    } else {
      copyFileSync(s, d);
    }
  }
}

copyDir(SRC, DEST);
console.log("[docs] synced to content/docs");
try {
  cpdir(SRC, DST);
  console.log("[docs] synced public/docs");
} catch {
  // ok if docs source missing
}
