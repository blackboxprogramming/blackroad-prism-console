import fs from "fs";
import path from "path";
import { parse } from "yaml";
import { Runbook, runbookSchema } from "./schema";

const RUNBOOK_DIR = path.resolve(process.cwd(), "prism/runbooks");

export function loadRunbooks(dir: string = RUNBOOK_DIR): Runbook[] {
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".yaml"));
  return files.map((f) => {
    const text = fs.readFileSync(path.join(dir, f), "utf8");
    const data = parse(text);
    return runbookSchema.parse(data);
  });
}
