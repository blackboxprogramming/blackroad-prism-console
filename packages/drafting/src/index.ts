import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { formatISO } from "date-fns";
import {
  AdvItem11,
  BlockerResult,
  DraftArtifact,
  DraftContext,
  NormDisclosureRecord,
  U4Amendment,
} from "@blackroad/disclosures/src/types";
import {
  aggregateSeverity,
  summarizeConflicts,
} from "@blackroad/disclosures/src/index";
import { computeDueDate, mapToADV, mapToU4 } from "@blackroad/mapping/src/index";

function earliestDiscoveredAt(record: NormDisclosureRecord): string {
  const dates = record.discoveredAts ?? [];
  if (dates.length === 0) {
    return new Date().toISOString();
  }
  const sorted = dates
    .map((value) => new Date(value))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());
  return (sorted[0] ?? new Date()).toISOString();
}

export interface DraftPacketsOptions {
  personId: string;
  firmId: string;
  disclosures: NormDisclosureRecord[];
  context: DraftContext;
  includeU4?: boolean;
  includeADV?: boolean;
}

export interface DraftResult {
  u4?: U4Amendment;
  adv?: AdvItem11;
  files: DraftArtifact[];
  manifestPath: string;
}

async function ensureDirectory(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

async function writeFileSafe(ctx: DraftContext, relativePath: string, contents: string | Buffer) {
  const absolute = path.join(ctx.outDir, relativePath);
  const exists = await fs
    .stat(absolute)
    .then(() => true)
    .catch(() => false);
  if (exists && !ctx.force) {
    throw new Error(`Refusing to overwrite existing artifact ${relativePath} without --force.`);
  }
  await ensureDirectory(path.dirname(absolute));
  await fs.writeFile(absolute, contents);
}

export function renderSummary(
  disclosures: NormDisclosureRecord[],
  u4?: U4Amendment,
  adv?: AdvItem11
): string {
  const riskScore = aggregateSeverity(disclosures);
  const conflicts = summarizeConflicts(disclosures);
  const lines: string[] = [];
  lines.push(`# Disclosure Summary`);
  lines.push("");
  lines.push(`- Generated: ${formatISO(new Date())}`);
  lines.push(`- Risk score: ${riskScore}`);
  lines.push(`- Total disclosures: ${disclosures.length}`);
  if (conflicts.length > 0) {
    lines.push("- Conflicts detected:");
    conflicts.forEach((conflict) => lines.push(`  - ${conflict}`));
  } else {
    lines.push("- Conflicts detected: None");
  }
  lines.push("");
  lines.push("## Events");
  lines.push("| UID | Category | Status | Event Date | Severity | Due By |");
  lines.push("| --- | --- | --- | --- | --- | --- |");
  disclosures.forEach((record) => {
    const discoveredAt = earliestDiscoveredAt(record);
    const { dueBy } = computeDueDate(record, discoveredAt);
    const dueDisplay = new Date(dueBy).toISOString().slice(0, 10);
    lines.push(
      `| ${record.uid} | ${record.category} | ${record.status} | ${record.eventDate ?? "--"} | ${record.severity} | ${dueDisplay} |`
    );
  });
  lines.push("");
  if (u4) {
    lines.push("## U4 Amendment");
    lines.push(`- Due by: ${u4.dueBy}`);
    lines.push(`- Reason: ${u4.reason}`);
  }
  if (adv) {
    lines.push("## ADV Item 11");
    lines.push(`- Firm ID: ${adv.firmId}`);
    lines.push(`- DRPs generated: ${adv.drps.length}`);
  }
  return lines.join("\n");
}

function collectArtifacts(
  ctx: DraftContext,
  disclosures: NormDisclosureRecord[],
  u4: U4Amendment | undefined,
  adv: AdvItem11 | undefined
): DraftArtifact[] {
  const artifacts: DraftArtifact[] = [];
  if (u4) {
    artifacts.push({ path: `u4_amendment_${u4.personId}.json`, contents: JSON.stringify(u4, null, 2) });
  }
  if (adv) {
    artifacts.push({ path: `adv_item11_${adv.firmId}.json`, contents: JSON.stringify(adv, null, 2) });
    adv.drps.forEach((drp) => {
      const match = drp.markdown.match(/DRP Stub for\s+([A-Za-z0-9_-]+)/);
      const uid = match ? match[1] : `event-${artifacts.length}`;
      artifacts.push({ path: path.join("drps", `${uid}.md`), contents: drp.markdown });
    });
  }
  const summary = renderSummary(disclosures, u4, adv);
  const summaryName = u4?.personId ?? disclosures[0]?.uid ?? "events";
  artifacts.push({ path: `summary_${summaryName}.md`, contents: summary });
  return artifacts;
}

function computeManifestEntries(artifacts: DraftArtifact[]): Array<{ path: string; checksum: string }> {
  return artifacts.map((artifact) => {
    const hash = crypto.createHash("sha256");
    hash.update(typeof artifact.contents === "string" ? artifact.contents : artifact.contents);
    return { path: artifact.path, checksum: hash.digest("hex") };
  });
}

async function writeManifest(ctx: DraftContext, entries: Array<{ path: string; checksum: string }>): Promise<string> {
  const manifestPath = path.join(ctx.outDir, "manifest.json");
  await writeFileSafe(ctx, "manifest.json", JSON.stringify({ generatedAt: new Date().toISOString(), files: entries }, null, 2));
  return manifestPath;
}

export async function draftPackets(options: DraftPacketsOptions): Promise<DraftResult> {
  const disclosures = options.disclosures;
  const ctx = options.context;
  const includeU4 = options.includeU4 ?? true;
  const includeADV = options.includeADV ?? true;

  let u4: U4Amendment | undefined;
  let adv: AdvItem11 | undefined;

  if (includeU4) {
    u4 = mapToU4(disclosures, { personId: options.personId });
  }
  if (includeADV) {
    adv = mapToADV(disclosures, { firmId: options.firmId, personId: options.personId });
  }

  const artifacts = collectArtifacts(ctx, disclosures, u4, adv);
  for (const artifact of artifacts) {
    await writeFileSafe(ctx, artifact.path, artifact.contents);
  }
  const manifestEntries = computeManifestEntries(artifacts);
  const manifestPath = await writeManifest(ctx, manifestEntries);

  return { u4, adv, files: artifacts, manifestPath };
}

function isArtifactMissing(ctx: DraftContext, relativePath: string): Promise<boolean> {
  const absolute = path.join(ctx.outDir, relativePath);
  return fs
    .stat(absolute)
    .then(() => false)
    .catch(() => true);
}

function hasElapsed(dueBy: string): boolean {
  return new Date(dueBy) < new Date();
}

export const blockers = {
  async canProceed(
    ctx: DraftContext,
    disclosures: NormDisclosureRecord[],
    action: "adviseClients" | "openAccounts" | "advertise"
  ): Promise<BlockerResult> {
    const requiredArtifacts: string[] = [];
    let blockedReason: string | undefined;

    for (const record of disclosures) {
      const discoveredAt = earliestDiscoveredAt(record);
      const { dueBy } = computeDueDate(record, discoveredAt);
      if (hasElapsed(dueBy)) {
        blockedReason = `Disclosure ${record.uid} is past due (${dueBy}).`;
        break;
      }
      if (record.needsHumanReview) {
        blockedReason = `Disclosure ${record.uid} requires human review.`;
        break;
      }
      const drpPath = path.join("drps", `${record.uid}.md`);
      if (await isArtifactMissing(ctx, drpPath)) {
        requiredArtifacts.push(drpPath);
      }
    }

    if (!blockedReason && requiredArtifacts.length > 0) {
      blockedReason = `Pending artifacts: ${requiredArtifacts.join(", ")}`;
    }

    return {
      allowed: !blockedReason,
      reason: blockedReason,
      requiredArtifacts: requiredArtifacts.length > 0 ? requiredArtifacts : undefined,
    };
  },
};
