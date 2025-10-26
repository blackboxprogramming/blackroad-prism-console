import { render, screen } from "@testing-library/react";
import { RunbookPage } from "@/components/RunbookPage";
import type { RunbookRecord } from "@/lib/runbook-data";

const runbook: RunbookRecord = {
  id: "test",
  title: "Test Runbook",
  summary: "A runbook used for testing",
  owners: ["team-ops"],
  tags: ["slo", "testing"],
  severity: "minor",
  lastReviewedAt: "2024-08-01",
  deprecated: false,
  preconditions: ["System healthy"],
  impact: "Affects reporting",
  rollback: ["None"],
  contacts: {
    team: "ops",
    slack: "#ops"
  },
  steps: [
    {
      id: "check",
      title: "Check",
      kind: "verify",
      description: "Verify service",
      guards: [],
      durationEstimateMin: 2,
      verify: {
        description: "Ensure service is valid"
      }
    },
    {
      id: "execute",
      title: "Execute",
      kind: "execute",
      guards: [
        {
          description: "Notify stakeholders",
          required: true
        }
      ],
      durationEstimateMin: 2,
      execute: {
        action: "connector.http.post",
        inputs: {}
      }
    }
  ],
  execution: {
    workflowName: "test_workflow",
    version: "1.0.0",
    idempotencyKeyHint: "rb-${runbook.id}-${ts}",
    variables: [],
    dryRunSupported: true
  },
  filePath: "runbooks/test.yaml",
  slug: "test"
};

describe("RunbookPage", () => {
  it("renders metadata and steps", () => {
    render(<RunbookPage runbook={runbook} />);
    expect(screen.getByText(/Test Runbook/)).toBeInTheDocument();
    expect(screen.getByText(/A runbook used for testing/)).toBeInTheDocument();
    expect(screen.getByText(/Check/)).toBeInTheDocument();
    expect(screen.getByText(/Execute/)).toBeInTheDocument();
    expect(screen.getByText(/SLO/)).toBeInTheDocument();
  });
});
