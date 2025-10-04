import { Decimal } from 'decimal.js';
import type { PositionSnapshot, Transaction } from '@blackroad/db';
import type { OnChainAdapter } from '../types.js';

export class OnChainWalletAdapter implements OnChainAdapter {
  async fetchBalances(params: { blockTag: string; wallet: string }): Promise<PositionSnapshot[]> {
    return [
      {
        id: `${params.wallet}-${params.blockTag}`,
        accountId: params.wallet,
        instrumentId: 'ETH',
        asOf: new Date(),
        quantity: new Decimal('1.2345'),
        marketValue: new Decimal('0'),
        price: new Decimal('0'),
        source: 'CHAIN'
      } as PositionSnapshot
    ];
  }

  async fetchTransfers(params: { from: Date; to: Date; wallet: string }): Promise<Transaction[]> {
    return [
      {
        id: `${params.wallet}-${params.from.toISOString()}`,
        accountId: params.wallet,
        instrumentId: 'ETH',
        tradeDate: params.from,
        settleDate: params.from,
        type: 'TRANSFER_IN',
        quantity: new Decimal('1'),
        price: null,
        grossAmount: new Decimal('0'),
        netAmount: new Decimal('0'),
        currency: 'ETH',
        externalId: null,
        source: 'CHAIN',
        meta: { txHash: '0x123' }
      } as unknown as Transaction
    ];
  }
}
