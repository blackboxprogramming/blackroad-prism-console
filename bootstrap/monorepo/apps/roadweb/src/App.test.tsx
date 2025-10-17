import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { App } from "./App";

const fetchSpy = vi.spyOn(globalThis, "fetch");

describe("App", () => {
  beforeAll(() => {
    fetchSpy.mockResolvedValue({
      json: async () => ({ result: "0x10" })
    } as Response);
  });

  afterEach(() => {
    fetchSpy.mockClear();
  });

  it("renders headline and checklist", async () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { level: 1, name: /RoadWeb Hello World/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/Bootstrapped Vite/)).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(4);

    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());
    await waitFor(() =>
      expect(screen.getByTestId("block").textContent).toContain("16")
    );
  });
});
