import { describe, it, expect, beforeAll } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";

import { parseBrokerCheckPDF } from "@blackroad/ingest-crd/src/index";
import { normalize, detectConflicts } from "@blackroad/disclosures/src/index";
import { RawDisclosure, NormDisclosureRecord } from "@blackroad/disclosures/src/types";
import { mapToU4, mapToADV, computeDueDate } from "@blackroad/mapping/src/index";
import { blockers } from "@blackroad/drafting/src/index";
import { DraftContext } from "@blackroad/disclosures/src/types";

describe("disclosure workflows", () => {
  let tempDir: string;

  beforeAll(async () => {
    tempDir = await fs.mkdtemp(path.join(process.cwd(), "tmp-disclosures-"));
  });

  it("parses brokercheck pdf into raw disclosures", async () => {
    const buffer = Buffer.from(
      `%PDF-1.4\nCustomer Dispute\nStatus: Pending\nEvent Date: 2023-10-01\nAmount Claimed: $5000`
    );
    const result = await parseBrokerCheckPDF(buffer);
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0].section).toContain("Customer");
  });

  it("deduplicates similar customer disputes", () => {
    const sample: RawDisclosure[] = [
      {
        source: "BrokerCheck",
        section: "Customer Dispute",
        discoveredAt: "2024-03-01T00:00:00.000Z",
        rawText: "Customer Dispute",
        fields: {
          Status: "Pending",
          "Event Date": "2024-02-01",
          "Amount Claimed": "$10,000",
        },
      },
      {
        source: "IAPD",
        section: "Customer Dispute",
        discoveredAt: "2024-03-02T00:00:00.000Z",
        rawText: "Customer Dispute",
        fields: {
          Status: "Pending",
          "Event Date": "2024-02-05",
          "Amount Claimed": "$10,050",
        },
      },
    ];
    const normalized = normalize(sample);
    expect(normalized).toHaveLength(1);
  });

  it("flags conflicts when sources disagree", () => {
    const sample: RawDisclosure[] = [
      {
        source: "BrokerCheck",
        section: "Regulatory",
        discoveredAt: "2024-01-01T00:00:00.000Z",
        rawText: "Regulatory",
        fields: {
          Status: "Pending",
          "Event Date": "2023-12-01",
        },
      },
      {
        source: "IAPD",
        section: "Regulatory",
        discoveredAt: "2024-01-02T00:00:00.000Z",
        rawText: "Regulatory",
        fields: {
          Status: "Final",
          "Event Date": "2023-12-15",
        },
      },
    ];
    const normalized = detectConflicts(normalize(sample));
    expect(normalized[0].conflict?.hasConflict).toBe(true);
    expect(normalized[0].needsHumanReview).toBe(true);
  });

  it("computes 10 business day deadline for felony", () => {
    const sample: RawDisclosure[] = [
      {
        source: "BrokerCheck",
        section: "Criminal - Felony",
        discoveredAt: "2024-01-02T00:00:00.000Z",
        rawText: "Felony charge",
        fields: {
          Status: "Pending",
          "Event Date": "2023-12-28",
          Charge: "Felony",
        },
      },
    ];
    const [record] = normalize(sample);
    const u4 = mapToU4([record], { personId: "person-1" });
    const dueBy = new Date(u4.dueBy);
    const { dueBy: expected } = computeDueDate(record, record.discoveredAts?.[0] ?? record.uid);
    expect(dueBy.toISOString()).toEqual(expected);
  });

  it("generates DRP markdown for each disclosure", () => {
    const sample: RawDisclosure[] = [
      {
        source: "BrokerCheck",
        section: "Customer",
        discoveredAt: "2024-03-01T00:00:00.000Z",
        rawText: "Customer Dispute",
        fields: {
          Status: "Pending",
          "Event Date": "2024-02-01",
        },
      },
      {
        source: "BrokerCheck",
        section: "Regulatory",
        discoveredAt: "2024-03-01T00:00:00.000Z",
        rawText: "Regulatory",
        fields: {
          Status: "Pending",
        },
      },
    ];
    const normalized = normalize(sample);
    const adv = mapToADV(normalized, { firmId: "firm-1", personId: "person-1" });
    expect(adv.drps).toHaveLength(normalized.length);
    adv.drps.forEach((drp) => {
      expect(drp.markdown).toMatch(/Category/);
      expect(drp.markdown).toMatch(/TODO/);
    });
  });

  it("blocks actions when deadlines have elapsed", async () => {
    const now = new Date();
    const staleDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()).toISOString();
    const record: NormDisclosureRecord = {
      uid: "uid-1",
      category: "Customer",
      status: "Pending",
      severity: 3,
      sourceRefs: [{ source: "BrokerCheck" }],
      discoveredAts: [staleDate],
    } as NormDisclosureRecord;
    const ctx: DraftContext = { outDir: tempDir };
    const result = await blockers.canProceed(ctx, [record], "adviseClients");
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/past due/);
  });
});
