import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MetricCard } from "./MetricCard";

describe("MetricCard", () => {
  it("renders label, value, and change", () => {
    render(<MetricCard label="System Uptime" value="48d" trend="up" change={2.5} />);
    expect(screen.getByText("System Uptime")).toBeInTheDocument();
    expect(screen.getByText("48d")).toBeInTheDocument();
    expect(screen.getByText("2.5%")).toBeInTheDocument();
  });

  it("renders negative change styling", () => {
    render(<MetricCard label="Latency" value="120 ms" trend="down" change={-3.2} />);
    expect(screen.getByText("Latency")).toBeInTheDocument();
    expect(screen.getByText("-3.2%")).toBeInTheDocument();
  });
});
