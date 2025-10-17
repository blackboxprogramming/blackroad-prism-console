import { createHash } from 'node:crypto';
import { z } from 'zod';

export interface WormBlock {
  idx: number;
  ts: Date;
  payload: Record<string, unknown>;
  prevHash: string;
  hash: string;
}

export const wormBlockSchema = z.object({
  idx: z.number().int().nonnegative(),
  ts: z.coerce.date(),
  payload: z.record(z.unknown()),
  prevHash: z.string(),
  hash: z.string()
});

export function computeHash(block: Omit<WormBlock, 'hash'>): string {
  const hash = createHash('sha256');
  hash.update(block.idx.toString());
  hash.update(block.ts.toISOString());
  hash.update(JSON.stringify(block.payload));
  hash.update(block.prevHash);
  return hash.digest('hex');
}

export function createBlock(
  payload: Record<string, unknown>,
  previous?: WormBlock,
  timestamp: Date = new Date()
): WormBlock {
  const base: Omit<WormBlock, 'hash'> = {
    idx: previous ? previous.idx + 1 : 0,
    ts: timestamp,
    payload,
    prevHash: previous ? previous.hash : 'GENESIS'
  };
  const hash = computeHash(base);
  return { ...base, hash };
}

export function verifyChain(blocks: WormBlock[]): boolean {
  if (!blocks.length) {
    return true;
  }
  return blocks.every((block, index) => {
    const prev = index === 0 ? undefined : blocks[index - 1];
    const expectedPrevHash = prev ? prev.hash : 'GENESIS';
    if (block.prevHash !== expectedPrevHash) {
      return false;
    }
    const { hash, ...rest } = block;
    const computed = computeHash(rest);
    return computed === hash;
  });
}

export function assertChain(blocks: WormBlock[]): void {
  if (!verifyChain(blocks)) {
    throw new Error('WORM chain verification failed');
  }
}
