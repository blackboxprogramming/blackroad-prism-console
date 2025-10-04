import { randomUUID } from "crypto";
import {
  AttestationRecord,
  CalendarItemRecord,
  CalendarStatus,
  ComplianceDb,
  CreateEvidenceInput,
  CreateReviewInput,
  EvidenceRecord,
  GateRecord,
  PolicyRecord,
  ReviewArtifactRecord,
  ReviewRecord,
  WormBlockRecord,
} from "./types.js";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export interface InMemoryDbOptions {
  now?: () => Date;
}

export const createInMemoryDb = (options: InMemoryDbOptions = {}): ComplianceDb => {
  const now = () => (options.now ? options.now() : new Date());
  let wormIndex = 0;

  const policies = new Map<string, PolicyRecord>();
  const attestations = new Map<string, AttestationRecord>();
  const reviews = new Map<string, ReviewRecord>();
  const evidences = new Map<string, EvidenceRecord>();
  const reviewArtifacts = new Map<string, ReviewArtifactRecord>();
  const calendarItems = new Map<string, CalendarItemRecord>();
  const gates = new Map<string, GateRecord>();
  const wormBlocks = new Map<number, WormBlockRecord>();

  const policyById = new Map<string, PolicyRecord>();

  return {
    policy: {
      async findByKey(key) {
        const match = policies.get(key);
        return match ? clone(match) : null;
      },
      async create(input) {
        const id = randomUUID();
        const record: PolicyRecord = {
          id,
          createdAt: now(),
          ...clone(input),
        };
        policies.set(record.key, record);
        policyById.set(id, record);
        return clone(record);
      },
      async update(id, input) {
        const existing = policyById.get(id);
        if (!existing) {
          throw new Error(`Policy ${id} not found`);
        }
        const updated: PolicyRecord = {
          ...existing,
          ...clone(input),
        };
        policies.set(updated.key, updated);
        policyById.set(id, updated);
        return clone(updated);
      },
      async list() {
        return Array.from(policies.values()).map(clone);
      },
    },
    attestation: {
      async create(input) {
        const id = randomUUID();
        const record: AttestationRecord = { id, ...clone(input) };
        attestations.set(id, record);
        return clone(record);
      },
      async findLatest(userId, policyId) {
        const values = Array.from(attestations.values()).filter(
          (a) => a.userId === userId && a.policyId === policyId
        );
        if (!values.length) {
          return null;
        }
        values.sort((a, b) => b.signedAt.getTime() - a.signedAt.getTime());
        return clone(values[0]);
      },
    },
    review: {
      async create(input: CreateReviewInput) {
        const id = randomUUID();
        const record: ReviewRecord = {
          id,
          createdAt: now(),
          ...clone(input),
        };
        reviews.set(id, record);
        return clone(record);
      },
    },
    evidence: {
      async create(input: CreateEvidenceInput) {
        const id = randomUUID();
        const record: EvidenceRecord = {
          id,
          createdAt: now(),
          ...clone(input),
        };
        evidences.set(id, record);
        return clone(record);
      },
    },
    reviewArtifact: {
      async link(input) {
        const id = randomUUID();
        const record: ReviewArtifactRecord = { id, ...clone(input) };
        reviewArtifacts.set(id, record);
        return clone(record);
      },
    },
    calendar: {
      async upsertByKey(key, input) {
        const existing = Array.from(calendarItems.values()).find((item) => item.key === key);
        if (existing) {
          const updated: CalendarItemRecord = {
            ...existing,
            ...clone(input),
          };
          calendarItems.set(updated.id, updated);
          return clone(updated);
        }
        const id = randomUUID();
        const record: CalendarItemRecord = {
          id,
          key,
          createdAt: now(),
          ...clone(input),
        };
        calendarItems.set(id, record);
        return clone(record);
      },
      async listOpen() {
        return Array.from(calendarItems.values())
          .filter((item) => item.status === "Open")
          .map(clone);
      },
      async setStatus(id, status, reason) {
        const record = calendarItems.get(id);
        if (!record) {
          throw new Error(`Calendar item ${id} not found`);
        }
        const updated: CalendarItemRecord = {
          ...record,
          status,
          blockers: reason
            ? [...(record.blockers ?? []), reason]
            : record.blockers ?? [],
        };
        calendarItems.set(id, updated);
        return clone(updated);
      },
    },
    gate: {
      async create(input) {
        const id = randomUUID();
        const record: GateRecord = {
          id,
          createdAt: now(),
          ...clone(input),
        };
        gates.set(id, record);
        return clone(record);
      },
    },
    worm: {
      async getLatest() {
        if (!wormBlocks.size) {
          return null;
        }
        const last = Math.max(...wormBlocks.keys());
        return clone(wormBlocks.get(last)!);
      },
      async append(input) {
        wormIndex += 1;
        const record: WormBlockRecord = {
          id: randomUUID(),
          idx: input.idx ?? wormIndex,
          ts: input.ts ?? now(),
          payload: clone(input.payload),
          prevHash: input.prevHash,
          hash: input.hash,
        };
        wormBlocks.set(record.idx, record);
        return clone(record);
      },
      async list() {
        return Array.from(wormBlocks.values())
          .sort((a, b) => a.idx - b.idx)
          .map(clone);
      },
    },
  };
};
