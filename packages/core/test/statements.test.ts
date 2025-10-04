import { describe, it, expect } from 'vitest';
import { StatementService } from '../src/statements/service.js';
import { Decimal } from 'decimal.js';

class FakePrisma {
  account = {
    findUniqueOrThrow: async () => ({
      id: 'ACC-001',
      accountNo: 'ACC-001',
      ownerId: 'Alexa Louise Amundson'
    })
  };
  reconBreak = {
    findFirst: async () => null
  };
  positionSnapshot = {
    findMany: async () => [
      {
        instrumentId: 'AAPL',
        quantity: new Decimal(100),
        price: new Decimal(150)
      }
    ]
  };
  transaction = {
    findMany: async () => [
      {
        tradeDate: new Date('2025-09-15'),
        type: 'DIV',
        netAmount: new Decimal(100),
        currency: 'USD'
      }
    ]
  };
  document = {
    findMany: async () => [],
    create: async ({ data }: any) => ({ id: 'doc1', ...data })
  };
  wormBlock = {
    findFirst: async () => null,
    findMany: async () => [],
    create: async ({ data }: any) => data
  };
}

describe('Statement service', () => {
  it('creates statement artifact', async () => {
    const prisma = new FakePrisma() as any;
    const service = new StatementService(prisma);
    const path = await service.generateStatement('ACC-001', '2025Q3');
    expect(path).toContain('ACC-001_2025Q3.pdf');
  });
});
