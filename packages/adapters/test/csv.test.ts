import { describe, it, expect } from 'vitest';
import { TraditionalCustodianCsvAdapter, CryptoExchangeCsvAdapter } from '../src/index.js';
import { join } from 'path';

const root = process.cwd();

describe('CSV adapters', () => {
  it('parses traditional custodian files', async () => {
    const adapter = new TraditionalCustodianCsvAdapter(join(root, 'packages/adapters/config/fidelity.yaml'));
    const positions = await adapter.importPositions({
      accountId: 'ACC-001',
      date: new Date('2025-09-30'),
      files: [join(root, 'samples/fidelity_positions.csv')]
    });
    const cash = await adapter.importCash({
      accountId: 'ACC-001',
      date: new Date('2025-09-30'),
      files: [join(root, 'samples/fidelity_cash.csv')]
    });
    const transactions = await adapter.importTransactions({
      accountId: 'ACC-001',
      from: new Date('2025-09-01'),
      to: new Date('2025-09-30'),
      files: [join(root, 'samples/fidelity_trades.csv')]
    });

    expect(positions).toHaveLength(2);
    expect(cash[0]?.balance.toString()).toBe('25000');
    expect(transactions[0]?.type).toBe('BUY');
  });

  it('parses crypto exchange files', async () => {
    const adapter = new CryptoExchangeCsvAdapter(join(root, 'packages/adapters/config/coinbase.yaml'));
    const transactions = await adapter.importFills({
      accountId: 'CRYPTO-001',
      from: new Date('2025-09-01'),
      to: new Date('2025-09-30'),
      files: [join(root, 'samples/coinbase_fills.csv')]
    });
    expect(transactions).toHaveLength(2);
    expect(transactions[0]?.meta?.fee).toBe('12');
  });
});
