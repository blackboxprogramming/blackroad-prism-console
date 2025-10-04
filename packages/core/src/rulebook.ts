import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import { Rulebook } from "./types.js";

export function loadRulebooksFromDirectory(directory: string): Rulebook[] {
  const files = readdirSync(directory, { withFileTypes: true });
  const rulebooks: Rulebook[] = [];

  for (const file of files) {
    if (!file.isFile() || !file.name.endsWith(".yml") && !file.name.endsWith(".yaml")) {
      continue;
    }

    const content = readFileSync(join(directory, file.name), "utf-8");
    const parsed = parse(content) as Rulebook;
    if (!parsed?.rules) {
      throw new Error(`Rulebook ${file.name} is missing rules`);
    }
    rulebooks.push(parsed);
  }

  return rulebooks;
}

export function findRulebook(rulebooks: Rulebook[], stateCode: string, track: string, licenseType: string): Rulebook | undefined {
  return rulebooks.find(
    (rulebook) =>
      rulebook.stateCode === stateCode &&
      rulebook.track === track &&
      rulebook.licenseType === licenseType
  );
}
