import { PrismaClient } from "@prisma/client";
import type {
  AttestationRecord,
  CalendarItemRecord,
  CalendarStatus,
  ComplianceDb,
  CreateReviewInput,
  PolicyRecord,
  ReviewRecord,
  WormBlockRecord,
} from "./types.js";

const mapPolicy = (policy: any): PolicyRecord => ({
  id: policy.id,
  key: policy.key,
  title: policy.title,
  version: policy.version,
  status: policy.status,
  body: policy.body,
  controls: policy.controls,
  effectiveAt: new Date(policy.effectiveAt),
  supersedesId: policy.supersedesId,
  createdAt: new Date(policy.createdAt),
});

const mapReview = (review: any): ReviewRecord => ({
  id: review.id,
  type: review.type,
  input: review.input,
  outcome: review.outcome,
  riskScore: review.riskScore,
  breaches: review.breaches,
  notes: review.notes,
  reviewerId: review.reviewerId,
  createdAt: new Date(review.createdAt),
});

export const createPrismaComplianceDb = (prisma: PrismaClient): ComplianceDb => {
  return {
    policy: {
      async findByKey(key) {
        const policy = await prisma.policy.findUnique({ where: { key } });
        return policy ? mapPolicy(policy) : null;
      },
      async create(input) {
        const created = await prisma.policy.create({ data: input });
        return mapPolicy(created);
      },
      async update(id, input) {
        const updated = await prisma.policy.update({ where: { id }, data: input });
        return mapPolicy(updated);
      },
      async list() {
        const records = await prisma.policy.findMany();
        return records.map(mapPolicy);
      },
    },
    attestation: {
      async create(input) {
        const record = await prisma.attestation.create({ data: input });
        return {
          id: record.id,
          userId: record.userId,
          policyId: record.policyId,
          period: record.period,
          answers: record.answers,
          signedAt: new Date(record.signedAt),
        } satisfies AttestationRecord;
      },
      async findLatest(userId, policyId) {
        const record = await prisma.attestation.findFirst({
          where: { userId, policyId },
          orderBy: { signedAt: "desc" },
        });
        if (!record) {
          return null;
        }
        return {
          id: record.id,
          userId: record.userId,
          policyId: record.policyId,
          period: record.period,
          answers: record.answers,
          signedAt: new Date(record.signedAt),
        } satisfies AttestationRecord;
      },
    },
    review: {
      async create(input: CreateReviewInput) {
        const record = await prisma.review.create({ data: input });
        return mapReview(record);
      },
    },
    evidence: {
      async create(input) {
        const record = await prisma.evidence.create({ data: input });
        return {
          id: record.id,
          kind: record.kind,
          path: record.path,
          sha256: record.sha256,
          meta: record.meta,
          createdAt: new Date(record.createdAt),
        };
      },
    },
    reviewArtifact: {
      async link(input) {
        const record = await prisma.reviewArtifact.create({ data: input });
        return {
          id: record.id,
          reviewId: record.reviewId,
          evidenceId: record.evidenceId,
          role: record.role,
        };
      },
    },
    calendar: {
      async upsertByKey(key, input) {
        const record = await prisma.calendarItem.upsert({
          where: { key },
          update: input,
          create: { key, ...input },
        });
        return {
          id: record.id,
          key: record.key,
          summary: record.summary,
          due: new Date(record.due),
          track: record.track,
          stateCode: record.stateCode,
          status: record.status as CalendarStatus,
          blockers: record.blockers,
          createdAt: new Date(record.createdAt),
        } satisfies CalendarItemRecord;
      },
      async listOpen() {
        const records = await prisma.calendarItem.findMany({ where: { status: "Open" } });
        return records.map((record) => ({
          id: record.id,
          key: record.key,
          summary: record.summary,
          due: new Date(record.due),
          track: record.track,
          stateCode: record.stateCode,
          status: record.status as CalendarStatus,
          blockers: record.blockers,
          createdAt: new Date(record.createdAt),
        } satisfies CalendarItemRecord));
      },
      async setStatus(id, status) {
        const record = await prisma.calendarItem.update({ where: { id }, data: { status } });
        return {
          id: record.id,
          key: record.key,
          summary: record.summary,
          due: new Date(record.due),
          track: record.track,
          stateCode: record.stateCode,
          status: record.status as CalendarStatus,
          blockers: record.blockers,
          createdAt: new Date(record.createdAt),
        } satisfies CalendarItemRecord;
      },
    },
    gate: {
      async create(input) {
        const record = await prisma.gate.create({ data: input });
        return {
          id: record.id,
          action: record.action,
          context: record.context,
          allowed: record.allowed,
          reason: record.reason,
          createdAt: new Date(record.createdAt),
        };
      },
    },
    worm: {
      async getLatest() {
        const record = await prisma.wormBlock.findFirst({
          orderBy: { idx: "desc" },
        });
        if (!record) {
          return null;
        }
        return {
          id: record.id,
          idx: record.idx,
          ts: new Date(record.ts),
          payload: record.payload,
          prevHash: record.prevHash,
          hash: record.hash,
        } satisfies WormBlockRecord;
      },
      async append(input) {
        const record = await prisma.wormBlock.create({ data: input });
        return {
          id: record.id,
          idx: record.idx,
          ts: new Date(record.ts),
          payload: record.payload,
          prevHash: record.prevHash,
          hash: record.hash,
        } satisfies WormBlockRecord;
      },
      async list() {
        const records = await prisma.wormBlock.findMany({ orderBy: { idx: "asc" } });
        return records.map((record) => ({
          id: record.id,
          idx: record.idx,
          ts: new Date(record.ts),
          payload: record.payload,
          prevHash: record.prevHash,
          hash: record.hash,
        } satisfies WormBlockRecord));
      },
    },
  } satisfies ComplianceDb;
};
