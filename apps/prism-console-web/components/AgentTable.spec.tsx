import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AgentTable } from "./AgentTable";
import type { AgentRecord } from "@/types/dashboard";

const agents: AgentRecord[] = [
  {
    id: "agent-1",
    name: "Ops Sentinel",
    domain: "Operations",
    status: "online",
    memoryUsageMb: 256,
    lastHeartbeat: new Date("2024-09-01T12:00:00Z").toISOString()
  }
];

describe("AgentTable", () => {
  it("renders agent rows", () => {
    render(<AgentTable agents={agents} />);
    expect(screen.getByText("Ops Sentinel")).toBeInTheDocument();
    expect(screen.getByText("Operations")).toBeInTheDocument();
    expect(screen.getByText(/256 MB/)).toBeInTheDocument();
  });

  it("renders loading state", () => {
    render(<AgentTable agents={[]} isLoading />);
    expect(screen.getByText(/Loading agents/i)).toBeInTheDocument();
  });
});
