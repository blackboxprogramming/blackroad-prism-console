import { createHash } from "node:crypto";
import type { PrismaClient } from "@prisma/client";

export interface WormAppendInput<T = unknown> {
  payload: T;
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
  tail(): Promise<WormBlock<T> | null>;
  all(): Promise<WormBlock<T>[]>;
  verify(): Promise<boolean>;
}

export class InMemoryWormLedger<T = unknown> implements WormLedger<T> {
  private blocks: WormBlock<T>[] = [];

  async append(entry: WormAppendInput<T>): Promise<WormBlock<T>> {
    const prev = this.blocks.at(-1) ?? null;
    const block: WormBlock<T> = {
      idx: prev ? prev.idx + 1 : 1,
      ts: new Date(),
      payload: entry.payload,
      prevHash: prev?.hash ?? "GENESIS",
      hash: computeHash(prev?.hash ?? "GENESIS", entry.payload),
    };
    this.blocks.push(block);
    return block;
  }

  async tail(): Promise<WormBlock<T> | null> {
    return this.blocks.at(-1) ?? null;
  }

  async all(): Promise<WormBlock<T>[]> {
    return [...this.blocks];
  }

  async verify(): Promise<boolean> {
    let prevHash = "GENESIS";
    for (const block of this.blocks) {
      const expected = computeHash(prevHash, block.payload);
      if (expected !== block.hash) return false;
      prevHash = block.hash;
    }
    return true;
  }
}

export class PrismaWormLedger<T = unknown> implements WormLedger<T> {
  constructor(private readonly prisma: PrismaClient) {}

  async append(entry: WormAppendInput<T>): Promise<WormBlock<T>> {
    const latest = await this.prisma.wormBlock.findFirst({
      orderBy: { idx: "desc" },
    });
    const prevHash = latest?.hash ?? "GENESIS";
    const block = await this.prisma.wormBlock.create({
      data: {
        idx: latest ? latest.idx + 1 : 1,
        payload: entry.payload as any,
        prevHash,
        hash: computeHash(prevHash, entry.payload),
      },
    });
    return {
      idx: block.idx,
      ts: block.ts,
      payload: block.payload as T,
      prevHash: block.prevHash,
      hash: block.hash,
    };
  }

  async tail(): Promise<WormBlock<T> | null> {
    const block = await this.prisma.wormBlock.findFirst({ orderBy: { idx: "desc" } });
    if (!block) return null;
    return {
      idx: block.idx,
      ts: block.ts,
      payload: block.payload as T,
      prevHash: block.prevHash,
      hash: block.hash,
    };
  }

  async all(): Promise<WormBlock<T>[]> {
    const blocks = await this.prisma.wormBlock.findMany({ orderBy: { idx: "asc" } });
    return blocks.map((block) => ({
      idx: block.idx,
      ts: block.ts,
      payload: block.payload as T,
      prevHash: block.prevHash,
      hash: block.hash,
    }));
  }

  async verify(): Promise<boolean> {
    const blocks = await this.prisma.wormBlock.findMany({ orderBy: { idx: "asc" } });
    let prevHash = "GENESIS";
    for (const block of blocks) {
      const expected = computeHash(prevHash, block.payload);
      if (expected !== block.hash) {
        return false;
      }
      prevHash = block.hash;
    }
    return true;
  }
}

export function computeHash(prevHash: string, payload: unknown): string {
  const content = JSON.stringify({ prevHash, payload });
  return createHash("sha256").update(content).digest("hex");
}
