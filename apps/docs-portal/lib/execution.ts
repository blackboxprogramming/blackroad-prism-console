import { v4 as uuidv4 } from "uuid";
import type { RunbookRecord } from "./runbook-data";

export interface ExecutionRequest {
  url: string;
  body: {
    workflowName: string;
    version: string;
    input: Record<string, unknown>;
    dryRun?: boolean;
  };
  headers: Record<string, string>;
}

export function deriveIdempotencyKey(
  hint: string,
  runbook: RunbookRecord,
  variables: Record<string, string>,
  timestamp: string = new Date().toISOString()
): string {
  let key = hint;
  key = key.replaceAll("${runbook.id}", runbook.id);
  key = key.replaceAll("${ts}", timestamp);
  Object.entries(variables).forEach(([name, value]) => {
    key = key.replaceAll(`\${${name}}`, value);
    key = key.replaceAll(`$${name}`, value);
  });
  return key;
}

export function buildExecutionRequest(
  runbook: RunbookRecord,
  variables: Record<string, string>,
  token: string,
  gatewayBaseUrl: string,
  dryRun: boolean
): ExecutionRequest {
  const idempotencyKey = deriveIdempotencyKey(runbook.execution.idempotencyKeyHint, runbook, variables);
  const body = {
    workflowName: runbook.execution.workflowName,
    version: runbook.execution.version,
    input: variables,
    dryRun: dryRun ? true : undefined
  };

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "Idempotency-Key": idempotencyKey,
    "x-correlation-id": uuidv4()
  };

  return {
    url: `${gatewayBaseUrl.replace(/\/$/, "")}/automation/runs`,
    body,
    headers
  };
}
