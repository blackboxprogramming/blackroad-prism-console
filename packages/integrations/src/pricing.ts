export interface PricingQuote {
  assetId: string;
  price: number;
  asOf: Date;
  currency: string;
}

export async function fetchEndOfDayPricing(assetIds: string[]): Promise<PricingQuote[]> {
  const now = new Date();
  return assetIds.map((assetId) => ({
    assetId,
    price: 1,
    asOf: now,
    currency: "USD",
  }));
}

export async function convertToUsd(
  amount: number,
  currency: string,
  rate?: number
): Promise<number> {
  if (currency === "USD") {
    return amount;
  }
  const fxRate = rate ?? 1;
  return amount * fxRate;
}

