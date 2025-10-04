import { describe, it, expect } from 'vitest';
import { WormLedger } from '../src/index.js';

class FakePrisma {
  records: any[] = [];
  wormBlock: any;

  constructor() {
    const self = this;
    this.wormBlock = {
      findFirst: async ({ orderBy }: any) => {
        if (!self.records.length) return null;
        return orderBy.idx === 'desc' ? self.records[self.records.length - 1] : self.records[0];
      },
      findMany: async ({ orderBy }: any) => {
        if (orderBy.idx === 'asc') {
          return [...self.records];
        }
        return [...self.records].reverse();
      },
      create: async ({ data }: any) => {
        self.records.push(data);
        return data;
      }
    };
  }
}

describe('WORM ledger', () => {
  it('detects tampering', async () => {
    const prisma = new FakePrisma() as any;
    const ledger = new WormLedger(prisma);
    await ledger.append({ payload: { type: 'A' } });
    await ledger.append({ payload: { type: 'B' } });
    expect(await ledger.verify()).toBe(true);
    prisma.records[1].payload = { type: 'HACKED' };
    expect(await ledger.verify()).toBe(false);
  });
});
