export const NAMES: string[] = [
  'ROBINHOOD_ETHEREUM','ROBINHOOD_BITCOIN','ROBINHOOD_LITECOIN','ROBINHOOD_AVALANCHE','ROBINHOOD_CHAINLINK','ROBINHOOD_SOLANA','ROBINHOOD_DOGE',
  'COINBASE_BITCOIN','COINBASE_LITECOIN','COINBASE_ETHEREUM','COINBASE_NEAR','COINBASE_ATOM','COINBASE_MLN','COINBASE_GRT','COINBASE_VECHAIN','COINBASE_POLYGON',
  'VENMO_BITCOIN','VENMO_ETHEREUM','VENMO_CHAINLINK','VENMO_PAYPALUSD',
  'ETH_ADDRESS','USDT_ETH_ADDRESS','USDC_ETH_ADDRESS','BNB_BSC_ADDRESS','MATIC_POLYGON_ADDRESS','AVAX_C_ADDRESS','LINK_ETH_ADDRESS',
  'BTC_ADDRESS','LTC_ADDRESS','DOGE_ADDRESS','BCH_ADDRESS',
  'SOL_ADDRESS','TON_ADDRESS',
  'ATOM_ADDRESS','DOT_ADDRESS','XRP_ADDRESS','TRX_ADDRESS','ADA_ADDRESS'
];

export default NAMES;
import { digestHex, mask } from '../../tools/addresses';

type AddressKey =
  | 'ROBINHOOD_ETHEREUM'
  | 'ROBINHOOD_BITCOIN'
  | 'ROBINHOOD_LITECOIN'
  | 'COINBASE_BITCOIN'
  | 'COINBASE_LITECOIN'
  | 'COINBASE_ETHEREUM'
  | 'COINBASE_NEAR'
  | 'COINBASE_GRT'
  | 'COINBASE_MLN'
  | 'COINBASE_VECHAIN'
  | 'COINBASE_POLYGON'
  | 'VENMO_BITCOIN'
  | 'VENMO_ETHEREUM'
  | 'VENMO_CHAINLINK'
  | 'VENMO_PAYPALUSD';

export type AddressMap = Partial<Record<AddressKey, string>>;

const ADDRESS_KEYS: AddressKey[] = [
  'ROBINHOOD_ETHEREUM',
  'ROBINHOOD_BITCOIN',
  'ROBINHOOD_LITECOIN',
  'COINBASE_BITCOIN',
  'COINBASE_LITECOIN',
  'COINBASE_ETHEREUM',
  'COINBASE_NEAR',
  'COINBASE_GRT',
  'COINBASE_MLN',
  'COINBASE_VECHAIN',
  'COINBASE_POLYGON',
  'VENMO_BITCOIN',
  'VENMO_ETHEREUM',
  'VENMO_CHAINLINK',
  'VENMO_PAYPALUSD'
];

export type AddressSummary = {
  name: AddressKey;
  length: number;
  masked: string;
  digest8: string;
};

type SummaryRow = {
  Secret: AddressKey;
  Length: number;
  Masked: string;
  Digest8: string;
};

export function loadAddresses(): AddressMap {
  const entries = ADDRESS_KEYS.map((key) => {
    const value = process.env[key];
    if (!value) {
      return undefined;
    }
    return [key, value] as const;
  }).filter((entry): entry is [AddressKey, string] => Boolean(entry));

  return Object.fromEntries(entries) as AddressMap;
}

export function summarizeAddresses(addresses: AddressMap = loadAddresses()): AddressSummary[] {
  return ADDRESS_KEYS.filter((key) => Boolean(addresses[key]))
    .map((key) => {
      const value = addresses[key];
      const masked = value ? mask(value) : '(missing)';
      const digest = value ? digestHex(value).slice(0, 8) : '--------';
      return {
        name: key,
        length: value?.length ?? 0,
        masked,
        digest8: digest
      };
    })
    .filter((summary) => summary.length > 0);
}

export function printDiagnostics(addresses: AddressMap = loadAddresses()): void {
  const summaries = summarizeAddresses(addresses);
  if (!summaries.length) {
    console.log('No addresses configured.');
    return;
  }

  const header = ['Secret', 'Length', 'Masked', 'Digest8'];
  const rows: SummaryRow[] = summaries.map((summary) => ({
    Secret: summary.name,
    Length: summary.length,
    Masked: summary.masked,
    Digest8: summary.digest8
  }));

  const widths = header.map((heading) =>
    Math.max(heading.length, ...rows.map((row) => String(row[heading as keyof SummaryRow]).length))
  );

  const divider = widths.map((width) => '-'.repeat(width)).join('-+-');
  const formatRow = (values: Record<string, string | number>) =>
    header
      .map((key, index) => String(values[key]).padEnd(widths[index]))
      .join(' | ');

  console.log(formatRow(Object.fromEntries(header.map((key) => [key, key]))));
  console.log(divider);
  rows.forEach((row) => console.log(formatRow(row)));
}
