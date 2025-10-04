#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { Command } from "commander";
import {
  parseBrokerCheckPDF,
  parseIAPDPDF,
  parseTextExport,
  needsHumanReviewFromParse,
} from "@blackroad/ingest-crd/src/index";
import {
  normalize,
  detectConflicts,
  sortDisclosures,
  NormDisclosureRecord,
  RawDisclosure,
} from "@blackroad/disclosures/src/index";
import { DraftContext, RawDisclosure as RawDisclosureType } from "@blackroad/disclosures/src/types";
import { draftPackets, renderSummary, blockers } from "@blackroad/drafting/src/index";

const program = new Command();
const DEFAULT_OUT = path.resolve(process.cwd(), "out");
const RAW_FILE = "raw_disclosures.json";
const NORM_FILE = "normalized_disclosures.json";

async function readFileMaybe(filePath?: string): Promise<Buffer | undefined> {
  if (!filePath) return undefined;
  return fs.readFile(path.resolve(filePath));
}

async function writeJsonSafe(outDir: string, fileName: string, data: unknown, force?: boolean) {
  const absolute = path.join(outDir, fileName);
  const exists = await fs
    .stat(absolute)
    .then(() => true)
    .catch(() => false);
  if (exists && !force) {
    throw new Error(`Refusing to overwrite ${fileName} without --force.`);
  }
  await fs.mkdir(path.dirname(absolute), { recursive: true });
  await fs.writeFile(absolute, JSON.stringify(data, null, 2));
}

async function readJson<T>(outDir: string, fileName: string): Promise<T> {
  const absolute = path.join(outDir, fileName);
  const buffer = await fs.readFile(absolute, "utf8");
  return JSON.parse(buffer) as T;
}

function ensureRawStructure(raws: RawDisclosure[]): RawDisclosure[] {
  return raws.map((raw) => ({
    ...raw,
    discoveredAt: raw.discoveredAt ?? new Date().toISOString(),
    fields: raw.fields ?? {},
  }));
}

program
  .name("blackroad-compliance")
  .description("BlackRoad Finance disclosure ingestion and drafting CLI");

program
  .command("ingest")
  .description("Ingest BrokerCheck and IAPD disclosures")
  .option("--brokercheck <file>", "Path to BrokerCheck PDF or text export")
  .option("--iapd <file>", "Path to IAPD PDF or text export")
  .option("--out <dir>", "Output directory", DEFAULT_OUT)
  .option("--force", "Overwrite existing artifacts")
  .action(async (options) => {
    const outDir = path.resolve(options.out ?? DEFAULT_OUT);
    await fs.mkdir(outDir, { recursive: true });

    const raw: RawDisclosure[] = [];
    if (options.brokercheck) {
      const buffer = await readFileMaybe(options.brokercheck);
      if (!buffer) throw new Error("Missing BrokerCheck file");
      const isText = path.extname(options.brokercheck).toLowerCase() === ".txt";
      const parsed = isText
        ? await parseTextExport(buffer.toString("utf8"), "BrokerCheck", new Date().toISOString())
        : await parseBrokerCheckPDF(buffer);
      raw.push(...parsed);
    }
    if (options.iapd) {
      const buffer = await readFileMaybe(options.iapd);
      if (!buffer) throw new Error("Missing IAPD file");
      const isText = path.extname(options.iapd).toLowerCase() === ".txt";
      const parsed = isText
        ? await parseTextExport(buffer.toString("utf8"), "IAPD", new Date().toISOString())
        : await parseIAPDPDF(buffer);
      raw.push(...parsed);
    }

    const structured = ensureRawStructure(raw);
    const requiresReview = needsHumanReviewFromParse(structured);

    await writeJsonSafe(outDir, RAW_FILE, { disclosures: structured, requiresReview }, options.force);
    console.log(`Ingested ${structured.length} disclosures → ${path.join(outDir, RAW_FILE)}`);
    if (requiresReview) {
      console.warn("[warn] Parser confidence <80%. Flagging for manual review.");
    }
  });

program
  .command("normalize")
  .description("Normalize and reconcile disclosures")
  .option("--out <dir>", "Output directory", DEFAULT_OUT)
  .option("--stale-days <number>", "Days before data is considered stale", parseInt)
  .option("--force", "Overwrite existing artifacts")
  .action(async (options) => {
    const outDir = path.resolve(options.out ?? DEFAULT_OUT);
    const rawPayload = await readJson<{ disclosures: RawDisclosureType[] }>(outDir, RAW_FILE);
    const normalized = detectConflicts(sortDisclosures(normalize(rawPayload.disclosures, {
      staleAfterDays: Number.isFinite(options.staleDays) ? Number(options.staleDays) : undefined,
    })));
    await writeJsonSafe(outDir, NORM_FILE, { disclosures: normalized }, options.force);
    console.log(`Normalized ${normalized.length} disclosures → ${path.join(outDir, NORM_FILE)}`);
  });

program
  .command("draft")
  .description("Draft U4 and ADV artifacts")
  .option("--out <dir>", "Output directory", DEFAULT_OUT)
  .option("--person <id>", "Person identifier", "unknown-person")
  .option("--firm <id>", "Firm identifier", "unknown-firm")
  .option("--no-u4", "Skip U4 amendment output")
  .option("--no-adv", "Skip ADV item 11 payload")
  .option("--force", "Overwrite existing artifacts")
  .action(async (options) => {
    const outDir = path.resolve(options.out ?? DEFAULT_OUT);
    const payload = await readJson<{ disclosures: NormDisclosureRecord[] }>(outDir, NORM_FILE);
    const ctx: DraftContext = { outDir, force: options.force };
    const result = await draftPackets({
      personId: options.person,
      firmId: options.firm,
      disclosures: payload.disclosures,
      context: ctx,
      includeU4: options.u4,
      includeADV: options.adv,
    });
    console.log(`Drafted ${result.files.length} artifacts. Manifest: ${result.manifestPath}`);
  });

program
  .command("gates")
  .description("Evaluate compliance gates for an action")
  .requiredOption("--action <action>", "Action to evaluate", (value) => value as
    "adviseClients" | "openAccounts" | "advertise")
  .option("--out <dir>", "Output directory", DEFAULT_OUT)
  .action(async (options) => {
    const outDir = path.resolve(options.out ?? DEFAULT_OUT);
    const payload = await readJson<{ disclosures: NormDisclosureRecord[] }>(outDir, NORM_FILE);
    const ctx: DraftContext = { outDir };
    const result = await blockers.canProceed(ctx, payload.disclosures, options.action);
    if (result.allowed) {
      console.log(`Allowed: action ${options.action} can proceed.`);
    } else {
      console.error(`Blocked: ${result.reason}`);
      if (result.requiredArtifacts?.length) {
        console.error(`Required artifacts: ${result.requiredArtifacts.join(", ")}`);
      }
      process.exitCode = 1;
    }
  });

program
  .command("summary")
  .description("Render disclosure summary")
  .option("--format <fmt>", "Output format (md|json)", "md")
  .option("--out <dir>", "Output directory", DEFAULT_OUT)
  .action(async (options) => {
    const outDir = path.resolve(options.out ?? DEFAULT_OUT);
    const payload = await readJson<{ disclosures: NormDisclosureRecord[] }>(outDir, NORM_FILE);
    if (options.format === "json") {
      process.stdout.write(JSON.stringify(payload.disclosures, null, 2));
      return;
    }
    const summary = renderSummary(payload.disclosures);
    process.stdout.write(summary);
  });

program.parseAsync(process.argv).catch((error) => {
  console.error(error.message);
  process.exit(1);
});
