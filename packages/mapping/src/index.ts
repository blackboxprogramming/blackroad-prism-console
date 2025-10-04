import { addDays, formatISO } from "date-fns";
import { AdvItem11, NormDisclosureRecord, U4Amendment } from "@blackroad/disclosures/src/types";

const STATUTORY_KEYWORDS = [
  /felony/i,
  /statutory\s+disqualification/i,
  /barred/i,
  /revocation/i,
  /suspension/i,
];

export interface MapToU4Options {
  personId: string;
  reason?: U4Amendment["reason"];
}

export interface MapToADVOptions {
  firmId: string;
  personId?: string;
}

interface DueDateComputation {
  dueBy: string;
  trigger: "standard" | "statutory";
}

function addBusinessDays(start: Date, days: number): Date {
  const result = new Date(start);
  while (days > 0) {
    result.setDate(result.getDate() + 1);
    const day = result.getDay();
    if (day !== 0 && day !== 6) {
      days -= 1;
    }
  }
  return result;
}

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

function isStatutorilyDisqualifying(record: NormDisclosureRecord): boolean {
  if (record.category === "Criminal" && record.subType) {
    if (/felony/i.test(record.subType)) {
      return true;
    }
  }
  const text = [record.allegations, record.resolution]
    .filter(Boolean)
    .join(" ");
  return STATUTORY_KEYWORDS.some((regex) => regex.test(text));
}

export function computeDueDate(
  record: NormDisclosureRecord,
  discoveredAt: string
): DueDateComputation {
  const baseDate = new Date(discoveredAt);
  const requiresExpedite = record.severity >= 5 && isStatutorilyDisqualifying(record);
  if (requiresExpedite) {
    const due = addBusinessDays(baseDate, 10);
    return { dueBy: due.toISOString(), trigger: "statutory" };
  }
  const due = addDays(baseDate, 30);
  return { dueBy: due.toISOString(), trigger: "standard" };
}

function buildU4SectionRecord(record: NormDisclosureRecord) {
  return {
    uid: record.uid,
    status: record.status,
    eventDate: record.eventDate,
    allegations: record.allegations,
    amountClaimed: record.amountClaimed,
    amountAwarded: record.amountAwarded,
    resolution: record.resolution,
    parties: record.parties,
    jurisdictions: record.jurisdictions,
    sourceRefs: record.sourceRefs,
    needsHumanReview: record.needsHumanReview ?? false,
    severity: record.severity,
  };
}

function setSection(
  sections: U4Amendment["sections"],
  key: keyof U4Amendment["sections"],
  entries: ReturnType<typeof buildU4SectionRecord>[]
) {
  sections[key] = entries.length > 0 ? { hasDisclosure: true, events: entries } : { hasDisclosure: false };
}

export function mapToU4(
  disclosures: NormDisclosureRecord[],
  options: MapToU4Options
): U4Amendment {
  const sections: U4Amendment["sections"] = {};
  const buckets: Record<string, ReturnType<typeof buildU4SectionRecord>[]> = {
    criminal: [],
    regulatory: [],
    civil: [],
    terminations: [],
    financial: [],
    customer: [],
    other: [],
  };

  let earliestDue: string | undefined;

  disclosures.forEach((record) => {
    const entry = buildU4SectionRecord(record);
    const discoveredAt = earliestDiscoveredAt(record);
    const { dueBy } = computeDueDate(record, discoveredAt);
    entry["dueBy"] = dueBy;
    const bucketKey = (() => {
      switch (record.category) {
        case "Criminal":
          return "criminal";
        case "Regulatory":
          return "regulatory";
        case "Civil":
          return "civil";
        case "Termination":
          return "terminations";
        case "Financial":
        case "JudgmentLien":
          return "financial";
        case "Customer":
          return "customer";
        default:
          return "other";
      }
    })();
    buckets[bucketKey].push(entry);
    if (!earliestDue || new Date(dueBy) < new Date(earliestDue)) {
      earliestDue = dueBy;
    }
  });

  (Object.keys(buckets) as Array<keyof typeof buckets>).forEach((key) => {
    setSection(sections, key, buckets[key]);
  });

  return {
    personId: options.personId,
    reason: options.reason ?? "UpdateDisclosure",
    sections,
    dueBy: earliestDue ?? formatISO(addDays(new Date(), 30)),
  };
}

function buildAdvItem(record: NormDisclosureRecord): { key: string; value: string } {
  const yesValue = `Yes - ${record.category} disclosure ${record.uid}`;
  const keyMap: Partial<Record<NormDisclosureRecord["category"], string>> = {
    Criminal: "Item 11.A",
    Regulatory: "Item 11.C",
    Civil: "Item 11.B",
    Customer: "Item 11.D",
    Financial: "Item 11.E",
    Termination: "Item 11.F",
    JudgmentLien: "Item 11.G",
    Other: "Item 11.H",
  };
  const key = keyMap[record.category] ?? "Item 11.H";
  return {
    key,
    value: yesValue,
  };
}

function buildDrpMarkdown(record: NormDisclosureRecord): string {
  const lines: string[] = [];
  lines.push(`# DRP Stub for ${record.uid}`);
  lines.push("");
  lines.push(`- Category: ${record.category}`);
  if (record.subType) {
    lines.push(`- Sub-Type: ${record.subType}`);
  }
  if (record.eventDate) {
    lines.push(`- Event Date: ${record.eventDate}`);
  }
  lines.push(`- Status: ${record.status}`);
  if (record.allegations) {
    lines.push("- Allegations:");
    lines.push(`  ${record.allegations}`);
  }
  if (record.resolution) {
    lines.push("- Resolution:");
    lines.push(`  ${record.resolution}`);
  }
  lines.push("- TODO: Complete DRP questions via compliance review.");
  return lines.join("\n");
}

export function mapToADV(
  disclosures: NormDisclosureRecord[],
  options: MapToADVOptions
): AdvItem11 {
  const items: AdvItem11["items"] = [];
  const drps: AdvItem11["drps"] = [];
  const seenKeys = new Set<string>();

  disclosures.forEach((record) => {
    const item = buildAdvItem(record);
    if (!seenKeys.has(item.key)) {
      seenKeys.add(item.key);
      items.push(item);
    }
    drps.push({ type: record.category, markdown: buildDrpMarkdown(record) });
  });

  if (items.length === 0) {
    items.push({ key: "Item 11", value: "No disciplinary disclosures." });
  }

  return {
    firmId: options.firmId,
    personId: options.personId,
    items,
    drps,
  };
}
