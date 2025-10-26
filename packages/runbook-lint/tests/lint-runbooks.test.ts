import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { lintRunbooks, summarizeReport, writeJsonReport } from "../src/index.js";

const OWNERS_REGISTRY = path.resolve(process.cwd(), "../../OWNERS.yml");

async function createTempDir(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "runbook-lint-"));
  return dir;
}

async function writeRunbook(dir: string, name: string, contents: string): Promise<string> {
  const filePath = path.join(dir, name);
  await fs.writeFile(filePath, contents, "utf8");
  return filePath;
}

describe("runbook lint", () => {
  it("passes for a valid runbook", async () => {
    const dir = await createTempDir();
    await writeRunbook(
      dir,
      "slo_report.yaml",
      `apiVersion: rb.blackroad.io/v1\nkind: Runbook\nmetadata:\n  id: slo_report\n  title: Test\n  summary: Summary\n  owners: [\"team-ops\"]\ncontacts:\n  team: ops\nsteps:\n  - id: check\n    title: Check\n    kind: manual\nexecution:\n  workflowName: slo_report\n  version: \"1.0.0\"\n`
    );

    const report = await lintRunbooks({ path: dir, ownersRegistryPath: OWNERS_REGISTRY });
    const summary = summarizeReport(report);
    expect(summary.ok).toBe(true);
    expect(report.messages).toHaveLength(0);
  });

  it("detects duplicate ids", async () => {
    const dir = await createTempDir();
    const base = `apiVersion: rb.blackroad.io/v1\nkind: Runbook\nmetadata:\n  id: duplicate\n  title: One\n  summary: Summary\n  owners: [\"team-ops\"]\ncontacts:\n  team: ops\nsteps:\n  - id: step\n    title: Step\n    kind: manual\nexecution:\n  workflowName: duplicate\n  version: \"1\"\n`;
    await writeRunbook(dir, "one.yaml", base);
    await writeRunbook(dir, "two.yaml", base);

    const report = await lintRunbooks({ path: dir, ownersRegistryPath: OWNERS_REGISTRY });
    const hasDuplicate = report.messages.some((msg) => msg.rule === "unique-id");
    expect(hasDuplicate).toBe(true);
  });

  it("flags potential secrets", async () => {
    const dir = await createTempDir();
    await writeRunbook(
      dir,
      "secret.yaml",
      `apiVersion: rb.blackroad.io/v1\nkind: Runbook\nmetadata:\n  id: secret\n  title: Secret\n  summary: Summary\n  owners: [\"team-ops\"]\ncontacts:\n  team: ops\nsteps:\n  - id: step\n    title: Step\n    kind: manual\n    notes: \"apiToken=ABCSECRET123456\"\nexecution:\n  workflowName: secret\n  version: \"1\"\n`
    );

    const report = await lintRunbooks({ path: dir, ownersRegistryPath: OWNERS_REGISTRY });
    expect(report.messages.find((msg) => msg.rule === "potential-secret")).toBeTruthy();
  });

  it("writes a JSON report", async () => {
    const dir = await createTempDir();
    await writeRunbook(
      dir,
      "invalid.yaml",
      `apiVersion: rb.blackroad.io/v1\nkind: Runbook\nmetadata:\n  id: invalid\n  title: Invalid\n  summary: Summary\n  owners: [\"team-ops\"]\ncontacts:\n  team: ops\nsteps: []\nexecution:\n  workflowName: invalid\n  version: \"1\"\n`
    );

    const report = await lintRunbooks({ path: dir, ownersRegistryPath: OWNERS_REGISTRY });
    const reportPath = path.join(dir, "report.json");
    await writeJsonReport(reportPath, report);
    const contents = await fs.readFile(reportPath, "utf8");
    const parsed = JSON.parse(contents);
    expect(parsed.messages.length).toBeGreaterThan(0);
  });
});
