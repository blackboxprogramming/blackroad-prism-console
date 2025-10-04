import { describe, it, expect } from 'vitest';
import { Decimal } from 'decimal.js';
import { buildPositionBreaks, buildCashBreaks } from '../src/recon/pure.js';
import { buildLots } from '../src/recon/costBasis.js';

describe('Reconciliation utilities', () => {
  it('flags position delta greater than epsilon', () => {
    const breaks = buildPositionBreaks({
      accountId: 'ACC-001',
      asOf: new Date('2025-09-30'),
      internal: [
        {
          id: 'int',
          accountId: 'ACC-001',
          instrumentId: 'AAPL',
          asOf: new Date('2025-09-30'),
          quantity: new Decimal(99),
          marketValue: new Decimal(0),
          price: new Decimal(0),
          source: 'INTERNAL'
        } as any
      ],
      external: [
        {
          id: 'ext',
          accountId: 'ACC-001',
          instrumentId: 'AAPL',
          asOf: new Date('2025-09-30'),
          quantity: new Decimal(100),
          marketValue: new Decimal(0),
          price: new Decimal(0),
          source: 'CUSTODIAN'
        } as any
      ]
    });
    expect(breaks).toHaveLength(1);
    expect(breaks[0]?.scope).toBe('POSITION');
  });

  it('computes cost basis using FIFO', () => {
    const transactions = [
      {
        id: '1',
        accountId: 'ACC-001',
        instrumentId: 'AAPL',
        tradeDate: new Date('2025-01-01'),
        settleDate: null,
        type: 'BUY',
        quantity: new Decimal(50),
        price: new Decimal(100),
        grossAmount: new Decimal(5000),
        netAmount: new Decimal(5000),
        currency: 'USD',
        externalId: '1',
        source: 'CUSTODIAN',
        meta: {}
      },
      {
        id: '2',
        accountId: 'ACC-001',
        instrumentId: 'AAPL',
        tradeDate: new Date('2025-02-01'),
        settleDate: null,
        type: 'BUY',
        quantity: new Decimal(50),
        price: new Decimal(110),
        grossAmount: new Decimal(5500),
        netAmount: new Decimal(5500),
        currency: 'USD',
        externalId: '2',
        source: 'CUSTODIAN',
        meta: {}
      },
      {
        id: '3',
        accountId: 'ACC-001',
        instrumentId: 'AAPL',
        tradeDate: new Date('2025-03-01'),
        settleDate: null,
        type: 'SELL',
        quantity: new Decimal(60),
        price: new Decimal(120),
        grossAmount: new Decimal(7200),
        netAmount: new Decimal(7200),
        currency: 'USD',
        externalId: '3',
        source: 'CUSTODIAN',
        meta: {}
      }
    ];

    const lots = buildLots({ transactions: transactions as any, method: 'FIFO', asOf: new Date('2025-03-31') });
    expect(lots.lots.find((lot) => !lot.closedDate)?.quantity.toNumber()).toBeCloseTo(40);
  });

  it('supports LIFO method', () => {
    const transactions = [
      {
        id: '1',
        accountId: 'ACC-001',
        instrumentId: 'AAPL',
        tradeDate: new Date('2025-01-01'),
        settleDate: null,
        type: 'BUY',
        quantity: new Decimal(10),
        price: new Decimal(100),
        grossAmount: new Decimal(1000),
        netAmount: new Decimal(1000),
        currency: 'USD',
        externalId: '1',
        source: 'CUSTODIAN',
        meta: {}
      },
      {
        id: '2',
        accountId: 'ACC-001',
        instrumentId: 'AAPL',
        tradeDate: new Date('2025-02-01'),
        settleDate: null,
        type: 'BUY',
        quantity: new Decimal(10),
        price: new Decimal(120),
        grossAmount: new Decimal(1200),
        netAmount: new Decimal(1200),
        currency: 'USD',
        externalId: '2',
        source: 'CUSTODIAN',
        meta: {}
      },
      {
        id: '3',
        accountId: 'ACC-001',
        instrumentId: 'AAPL',
        tradeDate: new Date('2025-03-01'),
        settleDate: null,
        type: 'SELL',
        quantity: new Decimal(5),
        price: new Decimal(130),
        grossAmount: new Decimal(650),
        netAmount: new Decimal(650),
        currency: 'USD',
        externalId: '3',
        source: 'CUSTODIAN',
        meta: {}
      }
    ];
    const lots = buildLots({ transactions: transactions as any, method: 'LIFO', asOf: new Date('2025-03-31') });
    expect(lots.realizedPnl.toNumber()).toBeCloseTo(50);
  });

  it('averages basis under average method', () => {
    const transactions = [
      {
        id: '1',
        accountId: 'ACC-001',
        instrumentId: 'AAPL',
        tradeDate: new Date('2025-01-01'),
        settleDate: null,
        type: 'BUY',
        quantity: new Decimal(10),
        price: new Decimal(100),
        grossAmount: new Decimal(1000),
        netAmount: new Decimal(1000),
        currency: 'USD',
        externalId: '1',
        source: 'CUSTODIAN',
        meta: {}
      },
      {
        id: '2',
        accountId: 'ACC-001',
        instrumentId: 'AAPL',
        tradeDate: new Date('2025-02-01'),
        settleDate: null,
        type: 'BUY',
        quantity: new Decimal(10),
        price: new Decimal(200),
        grossAmount: new Decimal(2000),
        netAmount: new Decimal(2000),
        currency: 'USD',
        externalId: '2',
        source: 'CUSTODIAN',
        meta: {}
      },
      {
        id: '3',
        accountId: 'ACC-001',
        instrumentId: 'AAPL',
        tradeDate: new Date('2025-03-01'),
        settleDate: null,
        type: 'SELL',
        quantity: new Decimal(10),
        price: new Decimal(150),
        grossAmount: new Decimal(1500),
        netAmount: new Decimal(1500),
        currency: 'USD',
        externalId: '3',
        source: 'CUSTODIAN',
        meta: {}
      }
    ];
    const lots = buildLots({ transactions: transactions as any, method: 'AVERAGE', asOf: new Date('2025-03-31') });
    expect(lots.realizedPnl.toNumber()).toBeCloseTo(0);
  });

  it('detects cash discrepancies', () => {
    const breaks = buildCashBreaks({
      accountId: 'ACC-001',
      asOf: new Date('2025-09-30'),
      internal: [
        {
          id: 'cash-int',
          accountId: 'ACC-001',
          asOf: new Date('2025-09-30'),
          currency: 'USD',
          balance: new Decimal(1000),
          source: 'INTERNAL'
        } as any
      ],
      external: [
        {
          id: 'cash-ext',
          accountId: 'ACC-001',
          asOf: new Date('2025-09-30'),
          currency: 'USD',
          balance: new Decimal(1100),
          source: 'CUSTODIAN'
        } as any
      ]
    });
    expect(breaks).toHaveLength(1);
    expect(breaks[0]?.scope).toBe('CASH');
  });
});
