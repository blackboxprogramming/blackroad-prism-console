import { Decimal } from 'decimal.js';
import type { CashLedger, PositionSnapshot, Transaction } from '@blackroad/db';
import type { CustodianAdapter } from '../types.js';
import { loadConfig, parseCsv } from './parser.js';

interface RawRow {
  [key: string]: string;
}

export class TraditionalCustodianCsvAdapter implements CustodianAdapter {
  constructor(private readonly configPath: string) {}

  private async mapRows<T>(files: string[], type: 'positions' | 'cash' | 'transactions'): Promise<RawRow[]> {
    const config = await loadConfig(this.configPath);
    const mapping = config.mappings.find((map) => map.type === type);
    if (!mapping) {
      throw new Error(`No mapping for ${type}`);
    }
    const rows: RawRow[] = [];
    for (const file of files) {
      const parsed = await parseCsv<RawRow>(file);
      parsed.forEach((row) => {
        const mapped: RawRow = { ...mapping.defaults };
        Object.entries(mapping.columns).forEach(([canonical, column]) => {
          mapped[canonical] = row[column];
        });
        rows.push(mapped);
      });
    }
    return rows;
  }

  async importPositions(params: { date: Date; accountId: string; files: string[] }): Promise<PositionSnapshot[]> {
    const rows = await this.mapRows(params.files, 'positions');
    return rows.map((row) => ({
      id: `${params.accountId}-${row['instrumentId']}-${params.date.toISOString()}`,
      accountId: params.accountId,
      instrumentId: row['instrumentId'],
      asOf: params.date,
      quantity: new Decimal(row['quantity']),
      marketValue: new Decimal(row['marketValue'] ?? row['quantity'] ?? '0'),
      price: new Decimal(row['price'] ?? '0'),
      source: 'CUSTODIAN'
    })) as PositionSnapshot[];
  }

  async importCash(params: { date: Date; accountId: string; files: string[] }): Promise<CashLedger[]> {
    const rows = await this.mapRows(params.files, 'cash');
    return rows.map((row) => ({
      id: `${params.accountId}-${row['currency']}-${params.date.toISOString()}`,
      accountId: params.accountId,
      asOf: params.date,
      currency: row['currency'],
      balance: new Decimal(row['balance']),
      source: 'CUSTODIAN'
    })) as CashLedger[];
  }

  async importTransactions(params: { from: Date; to: Date; accountId: string; files: string[] }): Promise<Transaction[]> {
    const rows = await this.mapRows(params.files, 'transactions');
    return rows.map((row) => ({
      id: row['externalId'] ? `${params.accountId}-${row['externalId']}` : undefined,
      accountId: params.accountId,
      instrumentId: row['instrumentId'] ?? null,
      tradeDate: new Date(row['tradeDate'] ?? params.from.toISOString()),
      settleDate: row['settleDate'] ? new Date(row['settleDate']) : null,
      type: row['type'],
      quantity: row['quantity'] ? new Decimal(row['quantity']) : null,
      price: row['price'] ? new Decimal(row['price']) : null,
      grossAmount: new Decimal(row['grossAmount'] ?? row['netAmount'] ?? '0'),
      netAmount: new Decimal(row['netAmount'] ?? row['grossAmount'] ?? '0'),
      currency: row['currency'] ?? 'USD',
      externalId: row['externalId'] ?? null,
      source: 'CUSTODIAN',
      meta: {}
    })) as unknown as Transaction[];
  }
}
