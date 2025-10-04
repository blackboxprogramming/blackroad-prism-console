import { Decimal } from 'decimal.js';
import type { Transaction, PositionSnapshot } from '@blackroad/db';
import type { ExchangeAdapter, CustodianAdapter } from '../types.js';
import { loadConfig, parseCsv } from './parser.js';

interface RawRow {
  [key: string]: string;
}

export class CryptoExchangeCsvAdapter implements ExchangeAdapter, CustodianAdapter {
  constructor(private readonly configPath: string) {}

  private async rows(type: 'positions' | 'transactions', files: string[]): Promise<RawRow[]> {
    const config = await loadConfig(this.configPath);
    const mapping = config.mappings.find((map) => map.type === type);
    if (!mapping) throw new Error(`No mapping for ${type}`);
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

  async importFills(params: { from: Date; to: Date; accountId: string; files: string[] }): Promise<Transaction[]> {
    const rows = await this.rows('transactions', params.files);
    return rows
      .filter((row) => {
        const date = new Date(row['tradeDate']);
        return date >= params.from && date <= params.to;
      })
      .map((row) => ({
        id: row['externalId'] ? `${params.accountId}-${row['externalId']}` : undefined,
        accountId: params.accountId,
        instrumentId: row['instrumentId'] ?? null,
        tradeDate: new Date(row['tradeDate']),
        settleDate: new Date(row['tradeDate']),
        type: row['type'],
        quantity: row['quantity'] ? new Decimal(row['quantity']) : null,
        price: row['price'] ? new Decimal(row['price']) : null,
        grossAmount: new Decimal(row['grossAmount'] ?? row['netAmount'] ?? '0'),
        netAmount: new Decimal(row['netAmount'] ?? row['grossAmount'] ?? '0'),
        currency: row['currency'] ?? 'USD',
        externalId: row['externalId'] ?? null,
        source: 'EXCHANGE',
        meta: {
          fee: row['fee'],
          chain: row['chain']
        }
      })) as unknown as Transaction[];
  }

  async importPositions(params: { date: Date; accountId: string; files: string[] }): Promise<PositionSnapshot[]> {
    const rows = await this.rows('positions', params.files);
    return rows.map((row) => ({
      id: `${params.accountId}-${row['instrumentId']}-${params.date.toISOString()}`,
      accountId: params.accountId,
      instrumentId: row['instrumentId'],
      asOf: params.date,
      quantity: new Decimal(row['quantity']),
      marketValue: new Decimal(row['marketValue'] ?? '0'),
      price: new Decimal(row['price'] ?? '0'),
      source: row['source'] ?? 'EXCHANGE'
    })) as PositionSnapshot[];
  }

  async importCash(): Promise<any[]> {
    return [];
  }

  async importTransactions(params: { from: Date; to: Date; accountId: string; files: string[] }): Promise<Transaction[]> {
    return this.importFills(params);
  }
}
