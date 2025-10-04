import { describe, it, expect } from 'vitest';
import { OnChainWalletAdapter } from '../src/onchain/walletAdapter.js';

describe('On-chain adapter', () => {
  it('produces balance and transfer records', async () => {
    const adapter = new OnChainWalletAdapter();
    const balances = await adapter.fetchBalances({ blockTag: 'latest', wallet: 'CRYPTO-001' });
    const transfers = await adapter.fetchTransfers({ from: new Date('2025-09-01'), to: new Date('2025-09-30'), wallet: 'CRYPTO-001' });
    expect(balances[0]?.source).toBe('CHAIN');
    expect(transfers[0]?.type).toBe('TRANSFER_IN');
  });
});
