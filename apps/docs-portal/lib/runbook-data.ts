import runbookPayload from "../.generated/runbooks.json";
import type { RunbookStep, RunbookVariable } from "@blackroad/runbook-types";

export interface RunbookRecord {
  id: string;
  title: string;
  summary: string;
  owners: string[];
  tags: string[];
  severity: "info" | "minor" | "major" | "critical";
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
  steps: RunbookStep[];
  execution: {
    workflowName: string;
    version: string;
    idempotencyKeyHint: string;
    variables: RunbookVariable[];
    dryRunSupported: boolean;
  };
  filePath: string;
  slug: string;
}

export interface RunbookSearchEntry {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  owners: string[];
  severity: string;
}

interface RunbookFile {
  generatedAt: string;
  runbooks: RunbookRecord[];
  searchIndex: RunbookSearchEntry[];
}

const data = runbookPayload as RunbookFile;

export function getRunbooks(): RunbookRecord[] {
  return data.runbooks;
}

export function getRunbookById(id: string): RunbookRecord | undefined {
  return data.runbooks.find((rb) => rb.id === id);
}

export function getSearchIndex(): RunbookSearchEntry[] {
  return data.searchIndex;
}

export function isSloTagged(runbook: RunbookRecord): boolean {
  return runbook.tags.map((tag) => tag.toLowerCase()).includes("slo");
}
