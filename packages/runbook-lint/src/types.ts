import type { Runbook } from "@blackroad/runbook-types";

export type Severity = "error" | "warning";

export interface LintMessage {
  filePath: string;
  runbookId?: string;
  rule: string;
  message: string;
  severity: Severity;
  hint?: string;
}

export interface RunbookDocument {
  filePath: string;
  runbook?: Runbook;
  parseError?: string;
}

export interface LintOptions {
  path: string;
  reportPath?: string;
  strict?: boolean;
  ownersRegistryPath?: string;
}

export interface LintReport {
  documents: RunbookDocument[];
  messages: LintMessage[];
}

export interface OwnerRegistry {
  owners: Set<string>;
}
