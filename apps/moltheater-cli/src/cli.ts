#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { Command } from "commander";
import { parseLua, type Perf, type PostEvent, type Say } from "./parseLua.js";
import { parseKey } from "./parseKey.js";
import { clampPerf } from "./validate.js";

interface CliOptions {
  bpm: string;
  time: string;
  format: "lua" | "key";
}

function readSource(input: string): string {
  if (input === "-") {
    return readFileSync(0, "utf8");
  }
  return readFileSync(input, "utf8");
}

function toNumber(value: string | number | undefined, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return fallback;
}

function buildPayload(
  header: Partial<Perf>,
  seq: Say[],
  post: PostEvent[],
  options: CliOptions
) {
  const bpm = toNumber(header.bpm, Number.parseFloat(options.bpm));
  const time = header.time ?? options.time;
  const quant = header.quant ?? "1/16";

  return {
    bpm,
    time,
    quant,
    voice: header.voice,
    key: header.key,
    seq,
    post,
  };
}

const program = new Command();
program
  .name("moltheater")
  .description("Convert Lua/ECM or coding-key markup into conductor JSON")
  .argument("<input>", "File path or '-' for stdin")
  .option("--bpm <n>", "Tempo", "120")
  .option("--time <sig>", "Time signature", "4/4")
  .option("--format <fmt>", "lua|key", "lua")
  .action((input: string, opts: CliOptions) => {
    const source = readSource(input);
    const format = opts.format ?? "lua";

    let header: Partial<Perf> = {};
    let seq: Say[] = [];
    let post: PostEvent[] = [];

    if (format === "lua") {
      const result = parseLua(source);
      header = result.header;
      seq = result.seq;
      post = result.post;
    } else if (format === "key") {
      header = {
        bpm: Number.parseFloat(opts.bpm),
        time: opts.time,
        quant: "1/16",
      };
      seq = parseKey(source);
      post = [];
    } else {
      throw new Error(`Unsupported format: ${format}`);
    }

    const clamped = clampPerf(seq);
    const payload = buildPayload(header, clamped, post, opts);
    process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  });

program.parse();
