import { describe, expect, it } from "vitest";
import { buildExecutionRequest, deriveIdempotencyKey } from "@/lib/execution";
import type { RunbookRecord } from "@/lib/runbook-data";

const runbook: RunbookRecord = {
  id: "test",
  title: "Test",
  summary: "Summary",
  owners: ["team-ops"],
  tags: [],
  severity: "info",
  lastReviewedAt: undefined,
  deprecated: false,
  preconditions: [],
  impact: undefined,
  rollback: [],
  contacts: {
    team: "ops"
  },
  steps: [],
  execution: {
    workflowName: "workflow",
    version: "1.0.0",
    idempotencyKeyHint: "rb-${runbook.id}-${SERVICE}-${ts}",
    variables: [
      {
        name: "SERVICE",
        type: "string",
        required: true
      }
    ],
    dryRunSupported: true
  },
  filePath: "runbooks/test.yaml",
  slug: "test"
};

describe("execution helpers", () => {
  it("derives idempotency key", () => {
    const key = deriveIdempotencyKey(runbook.execution.idempotencyKeyHint, runbook, { SERVICE: "api" }, "2024");
    expect(key).toEqual("rb-test-api-2024");
  });

  it("builds execution request", () => {
    const request = buildExecutionRequest(runbook, { SERVICE: "api" }, "token", "http://gateway", false);
    expect(request.url).toContain("http://gateway/automation/runs");
    expect(request.body.workflowName).toBe("workflow");
    expect(request.headers.Authorization).toBe("Bearer token");
  });
});
