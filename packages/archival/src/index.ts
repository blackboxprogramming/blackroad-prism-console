import { createHash } from "crypto";
import type { ComplianceDb, WormBlockRecord } from "@blackroad/compliance-db";

const GENESIS = "GENESIS";

const computeHash = (prevHash: string, payload: unknown, isoTs: string): string => {
  return createHash("sha256")
    .update(prevHash + JSON.stringify(payload) + isoTs)
    .digest("hex");
};

export interface AppendWormParams {
  db: ComplianceDb;
  payload: unknown;
  timestamp?: Date;
}

export const appendWorm = async ({ db, payload, timestamp }: AppendWormParams): Promise<WormBlockRecord> => {
  const latest = await db.worm.getLatest();
  const prevHash = latest?.hash ?? GENESIS;
  const idx = latest ? latest.idx + 1 : 1;
  const ts = timestamp ?? new Date();
  const isoTs = ts.toISOString();
  const hash = computeHash(prevHash, payload, isoTs);
  return db.worm.append({ idx, ts, payload, prevHash, hash });
};

export interface WormVerificationIssue {
  idx: number;
  reason: string;
}

export interface WormVerificationResult {
  ok: boolean;
  issues: WormVerificationIssue[];
}

export const verifyWormChain = async (db: ComplianceDb): Promise<WormVerificationResult> => {
  const blocks = await db.worm.list();
  const issues: WormVerificationIssue[] = [];
  let prevHash = GENESIS;
  let expectedIdx = 1;

  for (const block of blocks) {
    const iso = new Date(block.ts).toISOString();
    if (block.idx !== expectedIdx) {
      issues.push({ idx: block.idx, reason: `Expected index ${expectedIdx} but found ${block.idx}` });
    }
    const computed = computeHash(prevHash, block.payload, iso);
    if (computed !== block.hash) {
      issues.push({ idx: block.idx, reason: "Hash mismatch" });
    }
    prevHash = block.hash;
    expectedIdx += 1;
  }

  return { ok: issues.length === 0, issues };
};
