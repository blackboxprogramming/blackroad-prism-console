export type Chain = string;

export function isProbablyAddress(chain: Chain | string, addr: string): boolean {
  if (!addr) return false;
  const c = String(chain).toLowerCase();

  // Shared EVM style (ETH, BSC, Polygon, AVAX C-Chain, ERC-20 tokens like LINK/USDT/USDC/GRT)
  const isEvm = (a: string) => /^0x[a-fA-F0-9]{40}$/.test(a);

  switch (c) {
    case 'eth':
    case 'usdt':
    case 'usdc':
    case 'bnb':
    case 'matic':
    case 'avax':
    case 'link':
    case 'grt':
    case 'vet':
      return isEvm(addr);

    case 'btc':
      return /^bc1[ac-hj-np-z0-9]{25,87}$|^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(addr);

    case 'ltc':
      return /^ltc1[ac-hj-np-z0-9]{20,90}$|^[LM3][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(addr);

    case 'doge':
      return /^D[5-9A-HJ-NP-Ua-km-z]{25,34}$/.test(addr);

    case 'bch':
      return /^(bitcoincash:)?(q|p)[a-z0-9]{41}$/i.test(addr) ||
        /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(addr);

    case 'sol':
      return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(addr);

    case 'ton':
      return /^UQ[0-9A-Za-z_-]{46}$/.test(addr);

    case 'atom':
      return /^cosmos1[0-9a-z]{20,80}$/.test(addr);

    case 'dot':
      return /^[1-9A-HJ-NP-Za-km-z]{47,50}$/.test(addr);

    case 'xrp':
      return /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(addr);

    case 'trx':
      return /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(addr);

    case 'ada':
      return /^addr1[0-9a-z]{20,120}$/.test(addr);

    default:
      // fallback: treat it as EVM if looks like 0x40hex
      return isEvm(addr);
  }
}
