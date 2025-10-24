import { LedgerState } from '../types';

function formatNumber(value: number): string {
  return Number.isInteger(value) ? value.toString() : value.toFixed(6).replace(/\.0+$/, '.0');
}

export function timeseriesToCsv(series: LedgerState[]): string {
  const header = [
    'monthIndex',
    'date',
    'totalSupply',
    'circulating',
    'lockedTeam',
    'lockedTreasury',
    'lockedCommunity',
    'inflationPct',
    'minted',
    'burned',
    'unlockedTeam',
    'unlockedTreasury',
    'unlockedCommunity'
  ];

  const rows = series.map((point) => [
    point.monthIndex.toString(),
    point.date,
    formatNumber(point.totalSupply),
    formatNumber(point.circulating),
    formatNumber(point.locked.team),
    formatNumber(point.locked.treasury),
    formatNumber(point.locked.community),
    formatNumber(point.inflation),
    formatNumber(point.minted),
    formatNumber(point.burned),
    formatNumber(point.unlocked.team),
    formatNumber(point.unlocked.treasury),
    formatNumber(point.unlocked.community)
  ]);

  return [header.join(','), ...rows.map((row) => row.join(','))].join('\n');
}
