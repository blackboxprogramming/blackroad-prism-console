import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import type { Rulebook } from "@blackroad/core";

export function loadSeedRulebooks(baseDir: string): Rulebook[] {
  const directory = join(baseDir, "seeds", "rules");
  const entries = readdirSync(directory, { withFileTypes: true });
  const rulebooks: Rulebook[] = [];
  for (const entry of entries) {
    if (!entry.isFile() || (!entry.name.endsWith(".yaml") && !entry.name.endsWith(".yml"))) {
      continue;
    }
    const content = readFileSync(join(directory, entry.name), "utf-8");
    const parsed = parse(content) as Rulebook;
    rulebooks.push(parsed);
  }
  return rulebooks;
}
