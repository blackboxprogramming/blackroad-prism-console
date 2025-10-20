import { mkdirSync, readdirSync, copyFileSync } from "fs";
import { join } from "path";

const SRC = join(process.cwd(), "..", "..", "sites", "blackroad", "public", "portal");
const DST = join(process.cwd(), "public", "portal");
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
  console.log("[portal] synced public/portal");
} catch {
  // ok if missing
}
