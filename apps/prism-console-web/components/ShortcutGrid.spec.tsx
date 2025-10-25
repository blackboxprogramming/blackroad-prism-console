import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ShortcutGrid } from "./ShortcutGrid";

const shortcuts = [
  {
    id: "reboot",
    label: "Reboot Mesh",
    description: "Restart edge mesh",
    command: "brc mesh:reboot"
  }
];

describe("ShortcutGrid", () => {
  it("renders shortcut cards", () => {
    render(<ShortcutGrid shortcuts={shortcuts} />);
    expect(screen.getByText("Reboot Mesh")).toBeInTheDocument();
    expect(screen.getByText("brc mesh:reboot")).toBeInTheDocument();
  });
});
