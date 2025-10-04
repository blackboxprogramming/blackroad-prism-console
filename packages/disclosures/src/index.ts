import crypto from "node:crypto";
import { parseISO, differenceInCalendarDays, isValid } from "date-fns";
import { NormDisclosure, NormDisclosureRecord, RawDisclosure } from "./types";

const STATUS_PRIORITY: Record<string, number> = {
  Pending: 4,
  Unknown: 3,
  Final: 2,
  Dismissed: 1,
  Withdrawn: 1,
};

const CATEGORY_SEVERITY: Record<NormDisclosure["category"], number> = {
  Criminal: 5,
  Regulatory: 4,
  Civil: 3,
  Customer: 2,
  Financial: 3,
  Termination: 3,
  JudgmentLien: 3,
  Other: 1,
};

const STATUS_SEVERITY: Record<NormDisclosure["status"], number> = {
  Pending: 5,
  Final: 3,
  Dismissed: 2,
  Withdrawn: 2,
  Unknown: 4,
};

interface AggregatedSource {
  source: RawDisclosure["source"];
  status?: string;
  eventDate?: string;
  amountClaimed?: number;
  anchor?: string;
}

function parseAmount(value?: string): number | undefined {
  if (!value) return undefined;
  const numeric = value.replace(/[^0-9.\-]/g, "");
  const parsed = Number.parseFloat(numeric);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseDate(value?: string): string | undefined {
  if (!value) return undefined;
  const isoCandidate = value.match(/\d{4}-\d{2}-\d{2}/);
  if (isoCandidate) {
    return isoCandidate[0];
  }
  const parsed = Date.parse(value);
  if (!Number.isNaN(parsed)) {
    const d = new Date(parsed);
    return d.toISOString().slice(0, 10);
  }
  return undefined;
}

function determineCategory(section: string, fields: Record<string, string>): {
  category: NormDisclosure["category"];
  subType?: string;
} {
  const normalized = section.toLowerCase();
  if (normalized.includes("criminal")) {
    return { category: "Criminal", subType: fields["Charge"] ? fields["Charge"] : undefined };
  }
  if (normalized.includes("regulator")) {
    return { category: "Regulatory" };
  }
  if (normalized.includes("customer")) {
    return { category: "Customer", subType: fields["Type"] };
  }
  if (normalized.includes("civil")) {
    return { category: "Civil" };
  }
  if (normalized.includes("termination")) {
    return { category: "Termination" };
  }
  if (normalized.includes("financial") || normalized.includes("lien")) {
    return { category: normalized.includes("lien") ? "JudgmentLien" : "Financial" };
  }
  if (normalized.includes("judgment")) {
    return { category: "JudgmentLien" };
  }
  return { category: "Other" };
}

function normalizeStatus(raw: RawDisclosure): NormDisclosure["status"] {
  const value = raw.fields["Status"] || raw.fields["Current Status"];
  if (!value) return "Unknown";
  const normalized = value.toLowerCase();
  if (normalized.includes("pending") || normalized.includes("open")) return "Pending";
  if (normalized.includes("dismiss")) return "Dismissed";
  if (normalized.includes("withdraw")) return "Withdrawn";
  if (normalized.includes("final")) return "Final";
  return "Unknown";
}

function parseParties(raw: RawDisclosure): string[] | undefined {
  const field =
    raw.fields["Customer Name"] ||
    raw.fields["Customer Names"] ||
    raw.fields["Parties"] ||
    raw.fields["Customer(s)"];
  if (!field) return undefined;
  return field
    .split(/;|,|\band\b/i)
    .map((part) => part.trim())
    .filter(Boolean);
}

function parseJurisdictions(raw: RawDisclosure): string[] | undefined {
  const value = raw.fields["Jurisdiction"] || raw.fields["Jurisdictions"];
  if (!value) return undefined;
  return value
    .split(/;|,|\band\b/i)
    .map((part) => part.trim())
    .filter(Boolean);
}

function buildHashKey(
  category: NormDisclosure["category"],
  eventDate: string | undefined,
  jurisdictions?: string[],
  amount?: number,
  parties?: string[]
): string {
  const hash = crypto.createHash("sha256");
  hash.update(category);
  if (eventDate) {
    const parsed = Date.parse(eventDate);
    if (!Number.isNaN(parsed)) {
      const bucket = Math.floor(parsed / (1000 * 60 * 60 * 24 * 30));
      hash.update(bucket.toString());
    } else {
      hash.update(eventDate);
    }
  }
  if (jurisdictions) {
    hash.update(jurisdictions.sort().join("|"));
  }
  if (amount) {
    const bucket = Math.round(amount / 100) * 100;
    hash.update(bucket.toFixed(2));
  }
  if (parties) {
    hash.update(parties.map((p) => p.toLowerCase()).sort().join("|"));
  }
  return hash.digest("hex");
}

function selectStatus(a: NormDisclosure["status"], b: NormDisclosure["status"]): NormDisclosure["status"] {
  const priorityA = STATUS_PRIORITY[a] ?? 0;
  const priorityB = STATUS_PRIORITY[b] ?? 0;
  return priorityA >= priorityB ? a : b;
}

function computeSeverity(record: NormDisclosureRecord): number {
  const base = CATEGORY_SEVERITY[record.category] ?? 1;
  const statusScore = STATUS_SEVERITY[record.status] ?? 1;
  let severity = Math.max(base, statusScore);
  if (record.category === "Criminal" && record.subType) {
    if (/felony/i.test(record.subType)) {
      severity = Math.max(severity, 5);
    }
  }
  if (record.status === "Pending") {
    severity = Math.max(severity, 4);
  }
  return severity;
}

function mergeDisclosures(existing: NormDisclosureRecord, incoming: NormDisclosureRecord) {
  existing.sourceRefs = Array.from(
    new Map([
      ...existing.sourceRefs.map((ref) => [`${ref.source}-${ref.anchor ?? ""}`, ref]),
      ...incoming.sourceRefs.map((ref) => [`${ref.source}-${ref.anchor ?? ""}`, ref]),
    ])
      .values()
  );
  existing.parties = Array.from(new Set([...(existing.parties ?? []), ...(incoming.parties ?? [])]));
  existing.jurisdictions = Array.from(
    new Set([...(existing.jurisdictions ?? []), ...(incoming.jurisdictions ?? [])])
  );
  existing.allegations = existing.allegations || incoming.allegations;
  existing.resolution = existing.resolution || incoming.resolution;
  existing.amountClaimed = existing.amountClaimed ?? incoming.amountClaimed;
  existing.amountAwarded = existing.amountAwarded ?? incoming.amountAwarded;
  existing.eventDate = existing.eventDate || incoming.eventDate;
  existing.status = selectStatus(existing.status, incoming.status);
  existing.severity = Math.max(existing.severity, incoming.severity);
  existing.discoveredAts = Array.from(
    new Set([...(existing.discoveredAts ?? []), ...(incoming.discoveredAts ?? [])])
  );
}

function detectConflict(
  aggregated: AggregatedSource[],
  candidate: AggregatedSource
): { hasConflict: boolean; discrepancies: string[] } {
  const discrepancies: string[] = [];
  aggregated.forEach((item) => {
    if (item.status && candidate.status && item.status !== candidate.status) {
      discrepancies.push(`Status mismatch (${item.source}: ${item.status} vs ${candidate.source}: ${candidate.status})`);
    }
    if (item.eventDate && candidate.eventDate && item.eventDate !== candidate.eventDate) {
      discrepancies.push(
        `Event date mismatch (${item.source}: ${item.eventDate} vs ${candidate.source}: ${candidate.eventDate})`
      );
    }
    if (
      item.amountClaimed !== undefined &&
      candidate.amountClaimed !== undefined &&
      Math.abs(item.amountClaimed - candidate.amountClaimed) > 100
    ) {
      discrepancies.push(
        `Amount claimed mismatch (${item.source}: ${item.amountClaimed} vs ${candidate.source}: ${candidate.amountClaimed})`
      );
    }
  });
  return { hasConflict: discrepancies.length > 0, discrepancies };
}

export interface NormalizeOptions {
  staleAfterDays?: number;
}

export function normalize(raw: RawDisclosure[], options: NormalizeOptions = {}): NormDisclosureRecord[] {
  const staleAfterDays = options.staleAfterDays ?? 365;
  const deduped: NormDisclosureRecord[] = [];
  const aggregates: Record<string, AggregatedSource[]> = {};

  raw.forEach((item) => {
    const { category, subType } = determineCategory(item.section, item.fields);
    const eventDate = parseDate(
      item.fields["Event Date"] || item.fields["Occurrence Date"] || item.fields["Filed Date"]
    );
    const allegations = item.fields["Allegations"] || item.fields["Details"] || undefined;
    const resolution = item.fields["Resolution"] || item.fields["Disposition"] || undefined;
    const amountClaimed = parseAmount(item.fields["Amount Claimed"] || item.fields["Claim Amount"]);
    const amountAwarded = parseAmount(item.fields["Amount Awarded"] || item.fields["Settlement Amount"]);
    const parties = parseParties(item);
    const jurisdictions = parseJurisdictions(item);
    const status = normalizeStatus(item);

    const uid = buildHashKey(category, eventDate, jurisdictions, amountClaimed, parties);

    const norm: NormDisclosureRecord = {
      uid,
      category,
      subType,
      status,
      eventDate,
      allegations,
      amountClaimed,
      amountAwarded,
      resolution,
      jurisdictions,
      parties,
      sourceRefs: [
        {
          source: item.source,
          anchor: item.fields.__anchor,
        },
      ],
      severity: 1,
      discoveredAts: [item.discoveredAt],
    };

    norm.severity = computeSeverity(norm);

    const aggEntry: AggregatedSource = {
      source: item.source,
      status,
      eventDate,
      amountClaimed,
      anchor: item.fields.__anchor,
    };

    if (!aggregates[uid]) {
      aggregates[uid] = [aggEntry];
    } else {
      const conflict = detectConflict(aggregates[uid], aggEntry);
      aggregates[uid].push(aggEntry);
      if (conflict.hasConflict) {
        norm.conflict = conflict;
      }
    }

    const existing = deduped.find((d) => d.uid === uid);
    if (existing) {
      mergeDisclosures(existing, norm);
      if (norm.conflict) {
        existing.conflict = existing.conflict
          ? {
              hasConflict: existing.conflict.hasConflict || norm.conflict.hasConflict,
              discrepancies: Array.from(
                new Set([...(existing.conflict?.discrepancies ?? []), ...norm.conflict.discrepancies])
              ),
            }
          : norm.conflict;
      }
    } else {
      deduped.push(norm);
    }

    if (eventDate) {
      const event = parseISO(eventDate);
      if (isValid(event)) {
        const age = differenceInCalendarDays(new Date(), event);
        if (age > staleAfterDays) {
          const target = deduped.find((d) => d.uid === uid);
          if (target) {
            target.stale = true;
          }
        }
      }
    }

    if (!eventDate || status === "Unknown") {
      const target = deduped.find((d) => d.uid === uid);
      if (target) {
        target.needsHumanReview = true;
      }
    }
  });

  return deduped;
}

export function detectConflicts(disclosures: NormDisclosureRecord[]): NormDisclosureRecord[] {
  disclosures.forEach((record) => {
    if (record.conflict?.hasConflict) {
      record.needsHumanReview = true;
    }
  });
  return disclosures;
}

export function aggregateSeverity(disclosures: NormDisclosureRecord[]): number {
  if (disclosures.length === 0) return 0;
  const total = disclosures.reduce((acc, disclosure) => acc + disclosure.severity, 0);
  return Math.round(total / disclosures.length);
}

export function sortDisclosures(disclosures: NormDisclosureRecord[]): NormDisclosureRecord[] {
  return disclosures.sort((a, b) => b.severity - a.severity);
}

export function summarizeConflicts(disclosures: NormDisclosureRecord[]): string[] {
  const conflicts: string[] = [];
  disclosures.forEach((record) => {
    if (record.conflict?.hasConflict) {
      conflicts.push(`${record.uid}: ${record.conflict.discrepancies.join("; ")}`);
    }
  });
  return conflicts;
}

export type { RawDisclosure, NormDisclosureRecord } from "./types";
