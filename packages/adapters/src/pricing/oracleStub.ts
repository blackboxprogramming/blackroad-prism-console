import { Decimal } from 'decimal.js';
import type { PricingAdapter } from '../types.js';

export class OraclePricingAdapter implements PricingAdapter {
  async getPrice(params: { instrumentId: string; asOf: Date; currency: string }): Promise<string> {
    const base = new Decimal(params.instrumentId.length * 10);
    return base.toFixed(2);
  }
}
