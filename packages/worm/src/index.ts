import { createHash } from "node:crypto";
type PrismaClient = import("@blackroad/db").PrismaClient;

export interface WormAppendInput<T = unknown> {
  payload: T;
  timestamp?: Date;
}

export interface WormBlock<T = unknown> {
  idx: number;
  ts: Date;
  payload: T;
  prevHash: string;
  hash: string;
}

export interface WormLedger<T = unknown> {
  append(entry: WormAppendInput<T>): Promise<WormBlock<T>>;
  tail(): Promise<WormBlock<T> | null> | WormBlock<T> | null;
  all(): Promise<WormBlock<T>[]> | WormBlock<T>[];
}

export class InMemoryWormLedger<T = unknown> implements WormLedger<T> {
  private blocks: WormBlock<T>[] = [];

  async append(entry: WormAppendInput<T>): Promise<WormBlock<T>> {
    const prev = this.blocks[this.blocks.length - 1] ?? null;
    const ts = entry.timestamp ?? new Date();
    const safePayload = clonePayload(entry.payload);
    const block: WormBlock<T> = {
      idx: prev ? prev.idx + 1 : 1,
      ts,
      payload: safePayload,
      prevHash: prev?.hash ?? "GENESIS",
      hash: computeHash(prev?.hash ?? "GENESIS", ts, safePayload, prev ? prev.idx + 1 : 1),
    };
    this.blocks.push(block);
    return block;
  }

  tail(): WormBlock<T> | null {
    return this.blocks[this.blocks.length - 1] ?? null;
  }

  all(): WormBlock<T>[] {
    return [...this.blocks];
  }
}

export class PrismaWormLedger<T = unknown> implements WormLedger<T> {
  private clientPromise: Promise<PrismaClient> | null;

  constructor(client?: PrismaClient) {
    this.clientPromise = client ? Promise.resolve(client) : null;
  }

  async append(entry: WormAppendInput<T>): Promise<WormBlock<T>> {
    const client = await this.getClient();
    const prev = await client.wormBlock.findFirst({ orderBy: { idx: "desc" } });
    const idx = prev ? prev.idx + 1 : 1;
    const ts = entry.timestamp ?? new Date();
    const prevHash = prev?.hash ?? "GENESIS";
    const safePayload = clonePayload(entry.payload);
    const hash = computeHash(prevHash, ts, safePayload, idx);
    const record = await client.wormBlock.create({
      data: {
        idx,
        ts,
        payload: safePayload as unknown as object,
        prevHash,
        hash,
      },
    });
    return normalizeBlock<T>(record);
  }

  async tail(): Promise<WormBlock<T> | null> {
    const client = await this.getClient();
    const record = await client.wormBlock.findFirst({ orderBy: { idx: "desc" } });
    return record ? normalizeBlock<T>(record) : null;
  }

  async all(): Promise<WormBlock<T>[]> {
    const client = await this.getClient();
    const records = await client.wormBlock.findMany({ orderBy: { idx: "asc" } });
    return records.map((r) => normalizeBlock<T>(r));
  }

  private async getClient(): Promise<PrismaClient> {
    if (!this.clientPromise) {
      this.clientPromise = import("@blackroad/db").then((mod) => mod.prisma);
    }
    return this.clientPromise;
  }
}

export interface WormVerificationResult {
  valid: boolean;
  failureIndex?: number;
  reason?: string;
}

export function verifyChain<T>(blocks: WormBlock<T>[]): WormVerificationResult {
  if (blocks.length === 0) {
    return { valid: true };
  }

  for (let i = 0; i < blocks.length; i += 1) {
    const block = blocks[i];
    const expectedPrev = i === 0 ? "GENESIS" : blocks[i - 1].hash;
    const expectedIdx = i === 0 ? 1 : blocks[i - 1].idx + 1;
    if (block.prevHash !== expectedPrev) {
      return { valid: false, failureIndex: block.idx, reason: "Prev hash mismatch" };
    }
    if (block.idx !== expectedIdx) {
      return { valid: false, failureIndex: block.idx, reason: "Index gap" };
    }
    const expectedHash = computeHash(block.prevHash, block.ts, block.payload, block.idx);
    if (block.hash !== expectedHash) {
      return { valid: false, failureIndex: block.idx, reason: "Hash mismatch" };
    }
  }

  return { valid: true };
}

function computeHash(prevHash: string, ts: Date, payload: unknown, idx: number): string {
  const content = JSON.stringify({ prevHash, ts: ts.toISOString(), payload, idx });
  return createHash("sha256").update(content).digest("hex");
}

function normalizeBlock<T>(record: { idx: number; ts: Date; payload: unknown; prevHash: string; hash: string }): WormBlock<T> {
  return {
    idx: record.idx,
    ts: new Date(record.ts),
    payload: record.payload as T,
    prevHash: record.prevHash,
    hash: record.hash,
  };
}

function clonePayload<T>(payload: T): T {
  return JSON.parse(JSON.stringify(payload)) as T;
}

