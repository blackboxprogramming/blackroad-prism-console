import type { PrismaClient, ReconBreakStatus } from '@blackroad/db';
import { Decimal } from 'decimal.js';
import { DateTime } from 'luxon';
import { WormLedger } from '@blackroad/worm';
import { buildCashBreaks, buildCostBasisBreaks, buildPositionBreaks, buildTradeBreaks, type ReconBreakDraft } from './pure.js';
import { deriveInternalCash, deriveInternalPositions } from './internalPositions.js';
import { buildLots } from './costBasis.js';

export interface ReconciliationOptions {
  asOf: Date;
}

export class ReconciliationService {
  constructor(private readonly prisma: PrismaClient, private readonly worm = new WormLedger(prisma)) {}

  private async persistBreak(accountId: string, draft: ReconBreakDraft): Promise<void> {
    const existing = await this.prisma.reconBreak.findFirst({
      where: {
        accountId,
        asOf: draft.asOf,
        scope: draft.scope,
        key: draft.key,
        status: { in: ['OPEN', 'UNDER_REVIEW'] }
      }
    });
    if (existing) {
      await this.prisma.reconBreak.update({
        where: { id: existing.id },
        data: {
          internal: draft.internal?.toNumber(),
          external: draft.external?.toNumber(),
          severity: draft.severity,
          notes: draft.notes
        }
      });
      return;
    }

    const created = await this.prisma.reconBreak.create({
      data: {
        accountId,
        asOf: draft.asOf,
        scope: draft.scope,
        key: draft.key,
        internal: draft.internal?.toNumber(),
        external: draft.external?.toNumber(),
        status: 'OPEN',
        severity: draft.severity,
        notes: draft.notes
      }
    });
    await this.worm.append({
      reconBreakId: created.id,
      payload: {
        type: 'RECON_BREAK_CREATED',
        breakId: created.id,
        scope: draft.scope,
        key: draft.key,
        severity: draft.severity
      }
    });
  }

  async run({ asOf }: ReconciliationOptions): Promise<void> {
    const accounts = await this.prisma.account.findMany();
    for (const account of accounts) {
      const transactions = await this.prisma.transaction.findMany({
        where: { accountId: account.id, tradeDate: { lte: asOf } },
        orderBy: { tradeDate: 'asc' }
      });
      const externalSnapshots = await this.prisma.positionSnapshot.findMany({
        where: { accountId: account.id, asOf, source: { in: ['CUSTODIAN', 'EXCHANGE', 'CHAIN'] } }
      });
      const internalPositions = deriveInternalPositions(transactions, asOf);
      const internalSnapshots = Array.from(internalPositions.entries()).map(([instrumentId, quantity]) => ({
        id: `${account.id}-${instrumentId}-${asOf.toISOString()}`,
        accountId: account.id,
        instrumentId,
        asOf,
        quantity: quantity,
        marketValue: new Decimal(0),
        price: new Decimal(0),
        source: 'INTERNAL'
      }));

      const positionBreaks = buildPositionBreaks({
        accountId: account.id,
        asOf,
        external: externalSnapshots,
        internal: internalSnapshots as any
      });
      for (const draft of positionBreaks) {
        await this.persistBreak(account.id, draft);
      }

      const cashLedgers = await this.prisma.cashLedger.findMany({ where: { accountId: account.id, asOf } });
      const internalCashMap = deriveInternalCash(transactions, asOf);
      const internalCashLedgers = Array.from(internalCashMap.entries()).map(([currency, balance]) => ({
        id: `${account.id}-${currency}-${asOf.toISOString()}`,
        accountId: account.id,
        asOf,
        currency,
        balance,
        source: 'INTERNAL'
      }));
      const cashBreaks = buildCashBreaks({
        accountId: account.id,
        asOf,
        external: cashLedgers,
        internal: internalCashLedgers as any
      });
      for (const draft of cashBreaks) {
        await this.persistBreak(account.id, draft);
      }

      const externalTrades = transactions.filter((tx) => tx.source !== 'MANUAL');
      const internalTrades = transactions.filter((tx) => tx.source === 'MANUAL' || tx.source === 'CUSTODIAN');
      const tradeBreaks = buildTradeBreaks({
        accountId: account.id,
        asOf,
        external: externalTrades,
        internal: internalTrades
      });
      for (const draft of tradeBreaks) {
        await this.persistBreak(account.id, draft);
      }

      const lots = buildLots({ transactions, method: (account.meta as any)?.costMethod ?? 'FIFO', asOf });
      const costBreaks = buildCostBasisBreaks({
        accountId: account.id,
        asOf,
        transactions,
        method: ((account.meta as any)?.costMethod ?? 'FIFO') as 'FIFO' | 'LIFO' | 'SPEC_ID' | 'AVERAGE'
      });
      for (const draft of costBreaks) {
        await this.persistBreak(account.id, draft);
      }

      const aged = positionBreaks
        .concat(cashBreaks)
        .filter((item) => item.severity >= 80 && DateTime.fromJSDate(asOf).diff(DateTime.fromJSDate(item.asOf), 'days').days > 2);
      for (const draft of aged) {
        await this.transitionBreak(account.id, draft.key, draft.scope, 'UNDER_REVIEW', 'Auto escalated due to SLA breach');
      }

      await this.worm.append({
        payload: {
          type: 'RECON_RUN',
          accountId: account.id,
          asOf: asOf.toISOString(),
          breaksCreated: positionBreaks.length + cashBreaks.length + tradeBreaks.length + costBreaks.length,
          lotsOpen: lots.lots.filter((lot) => !lot.closedDate).length
        }
      });
    }
  }

  async transitionBreak(
    accountId: string,
    key: string,
    scope: string,
    status: ReconBreakStatus,
    note?: string
  ): Promise<void> {
    const target = await this.prisma.reconBreak.findFirst({ where: { accountId, key, scope } });
    if (!target) return;
    await this.prisma.reconBreak.update({
      where: { id: target.id },
      data: { status, notes: note ?? target.notes, resolvedAt: status === 'RESOLVED' || status === 'WAIVED' ? new Date() : null }
    });
    await this.worm.append({
      reconBreakId: target.id,
      payload: {
        type: 'RECON_BREAK_STATUS',
        breakId: target.id,
        status,
        note
      }
    });
  }
}
