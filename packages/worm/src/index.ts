import { createHash } from "node:crypto";

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
  tail(): WormBlock<T> | null;
  all(): WormBlock<T>[];
}

export class InMemoryWormLedger<T = unknown> implements WormLedger<T> {
  private blocks: WormBlock<T>[] = [];

  async append(entry: WormAppendInput<T>): Promise<WormBlock<T>> {
    const prev = this.blocks[this.blocks.length - 1] ?? null;
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

  tail(): WormBlock<T> | null {
    return this.blocks[this.blocks.length - 1] ?? null;
  }

  all(): WormBlock<T>[] {
    return [...this.blocks];
  }
}

function computeHash(prevHash: string, payload: unknown): string {
  const content = JSON.stringify({ prevHash, payload });
  return createHash("sha256").update(content).digest("hex");
}

