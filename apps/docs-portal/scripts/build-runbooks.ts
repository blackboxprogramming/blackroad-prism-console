import fs from "node:fs/promises";
import path from "node:path";
import fg from "fast-glob";
import yaml from "yaml";
import { runbookSchema } from "@blackroad/runbook-types";

interface RunbookRecord {
  id: string;
  title: string;
  summary: string;
  owners: string[];
  tags: string[];
  severity: string;
  lastReviewedAt?: string;
  deprecated: boolean;
  preconditions: string[];
  impact?: string;
  rollback: string[];
  contacts: {
    team: string;
    slack?: string;
    email?: string;
    pagerduty?: string;
  };
  steps: unknown[];
  execution: unknown;
  filePath: string;
  slug: string;
}

interface SearchEntry {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  owners: string[];
  severity: string;
}

async function buildRunbooks() {
  const repoRoot = path.resolve(process.cwd(), "../../");
  const runbooksDir = path.resolve(repoRoot, "runbooks");
  const outputPath = path.resolve(process.cwd(), ".generated/runbooks.json");

  const files = await fg("**/*.yaml", { cwd: runbooksDir, absolute: true });
  const runbooks: RunbookRecord[] = [];

  for (const file of files) {
    const contents = await fs.readFile(file, "utf8");
    const parsed = yaml.parse(contents);
    const result = runbookSchema.safeParse(parsed);
    if (!result.success) {
      console.error(`Runbook validation failed for ${path.basename(file)}:\n${result.error.message}`);
      throw result.error;
    }
    const runbook = result.data;
    runbooks.push({
      id: runbook.metadata.id,
      title: runbook.metadata.title,
      summary: runbook.metadata.summary,
      owners: runbook.metadata.owners,
      tags: runbook.metadata.tags,
      severity: runbook.metadata.severity,
      lastReviewedAt: runbook.metadata.lastReviewedAt,
      deprecated: runbook.metadata.deprecated,
      preconditions: runbook.preconditions,
      impact: runbook.impact,
      rollback: runbook.rollback,
      contacts: runbook.contacts,
      steps: runbook.steps,
      execution: runbook.execution,
      filePath: path.relative(repoRoot, file),
      slug: runbook.metadata.id
    });
  }

  const idSet = new Set<string>();
  runbooks.forEach((rb) => {
    if (idSet.has(rb.id)) {
      throw new Error(`Duplicate runbook id detected during build: ${rb.id}`);
    }
    idSet.add(rb.id);
  });

  const searchIndex: SearchEntry[] = runbooks.map((rb) => ({
    id: rb.id,
    title: rb.title,
    summary: rb.summary,
    tags: rb.tags,
    owners: rb.owners,
    severity: rb.severity
  }));

  const payload = {
    generatedAt: new Date().toISOString(),
    runbooks,
    searchIndex
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(payload, null, 2), "utf8");
  console.log(`Generated ${runbooks.length} runbook entries`);
}

buildRunbooks().catch((error) => {
  console.error("Failed to generate runbook data", error);
  process.exit(1);
});
