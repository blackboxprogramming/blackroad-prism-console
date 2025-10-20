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

try {
  cpdir(SRC, DST);
  console.log("[docs] synced public/docs");
} catch {
  // ok if docs source missing
}
