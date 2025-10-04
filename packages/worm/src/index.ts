import crypto from 'crypto';
import stringify from 'fast-json-stable-stringify';
import type { PrismaClient, WormBlock } from '@blackroad/db';

export interface WormAppendInput {
  payload: Record<string, unknown>;
  documentId?: string;
  reconBreakId?: string;
}

export class WormLedger {
  constructor(private readonly prisma: PrismaClient) {}

  private async getTail(): Promise<WormBlock | null> {
    return this.prisma.wormBlock.findFirst({
      orderBy: { idx: 'desc' }
    });
  }

  private computeHash(payload: unknown, prevHash: string): string {
    const body = stringify({ payload, prevHash });
    return crypto.createHash('sha256').update(body).digest('hex');
  }

  async append(entry: WormAppendInput): Promise<WormBlock> {
    const tail = await this.getTail();
    const payload = { ...entry.payload, ts: new Date().toISOString() };
    const prevHash = tail?.hash ?? ''.padEnd(64, '0');
    const hash = this.computeHash(payload, prevHash);
    return this.prisma.wormBlock.create({
      data: {
        payload,
        prevHash,
        hash,
        idx: (tail?.idx ?? 0) + 1,
        documentId: entry.documentId,
        reconBreakId: entry.reconBreakId
      }
    });
  }

  async verify(): Promise<boolean> {
    const blocks = await this.prisma.wormBlock.findMany({ orderBy: { idx: 'asc' } });
    let prevHash = ''.padEnd(64, '0');
    for (const block of blocks) {
      const expected = this.computeHash(block.payload, prevHash);
      if (expected !== block.hash) {
        return false;
      }
      prevHash = block.hash;
    }
    return true;
  }
}
