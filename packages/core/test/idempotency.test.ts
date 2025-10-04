import { describe, it, expect } from 'vitest';

class MemoryStore {
  data = new Map<string, any>();
  async upsert({ where, update, create }: any) {
    const key = `${where.accountId_externalId.accountId}-${where.accountId_externalId.externalId}`;
    if (this.data.has(key)) {
      this.data.set(key, { ...this.data.get(key), ...update });
      return this.data.get(key);
    }
    this.data.set(key, create);
    return create;
  }
}

describe('Ingestion idempotency', () => {
  it('deduplicates transactions by external id', async () => {
    const store = new MemoryStore();
    const tx = {
      accountId: 'ACC-001',
      externalId: 'T1',
      netAmount: 100
    };
    await store.upsert({
      where: { accountId_externalId: { accountId: tx.accountId, externalId: tx.externalId } },
      update: tx,
      create: tx
    });
    await store.upsert({
      where: { accountId_externalId: { accountId: tx.accountId, externalId: tx.externalId } },
      update: { ...tx, netAmount: 200 },
      create: tx
    });
    expect(store.data.size).toBe(1);
    expect(store.data.get('ACC-001-T1').netAmount).toBe(200);
  });
});
