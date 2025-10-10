import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { validateToolDefinition } from "../src/harness";

async function loadExample(name: string) {
  const path = resolve(__dirname, "../examples/tools", `${name}.json`);
  const contents = await readFile(path, "utf8");
  return JSON.parse(contents);
}

describe("tool schema", () => {
  it("accepts the reference search tool", async () => {
    const tool = await loadExample("search");
    const result = validateToolDefinition(tool);

    expect(result.valid).toBe(true);
    expect(result.data).toBeDefined();
  });

  it("rejects a tool with an invalid name", async () => {
    const tool = await loadExample("search");
    tool.name = "1bad";

    const result = validateToolDefinition(tool);
    expect(result.valid).toBe(false);
    expect(result.errors?.some((msg) => msg.includes("name"))).toBe(true);
  });

  it("rejects a tool without an input schema", () => {
    const result = validateToolDefinition({
      name: "no_input",
      description: "A tool missing the required schema",
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
  });
});
