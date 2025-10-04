import { createHash } from "crypto";
import { nanoid } from "nanoid";
import type { WormBlock } from "@blackroad/db";

export interface WormAdapter {
  persistBlock(block: WormBlock): Promise<void>;
  getLastBlock(): Promise<WormBlock | undefined>;
}

export class InMemoryWormAdapter implements WormAdapter {
  private blocks: WormBlock[] = [];

  async persistBlock(block: WormBlock): Promise<void> {
    this.blocks.push(block);
  }

  async getLastBlock(): Promise<WormBlock | undefined> {
    return this.blocks.at(-1);
  }

  getAll(): WormBlock[] {
    return [...this.blocks];
  }
}

export async function append(adapter: WormAdapter, payload: Record<string, unknown>): Promise<WormBlock> {
  const last = await adapter.getLastBlock();
  const idx = last ? last.idx + 1 : 0;
  const ts = new Date();
  const prevHash = last?.hash ?? "GENESIS";
  const hash = createHash("sha256")
    .update(`${prevHash}:${ts.toISOString()}:${JSON.stringify(payload)}`)
    .digest("hex");
  const block: WormBlock = {
    id: nanoid(),
    idx,
    ts,
    payload,
    prevHash,
    hash,
  };
  await adapter.persistBlock(block);
  return block;
}
