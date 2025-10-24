import { LedgerState } from '../types';

function normalise(values: number[]): number[] {
  const max = Math.max(...values, 1);
  return values.map((value) => (value / max) * 100);
}

function pointsToPath(values: number[]): string {
  return values
    .map((value, index) => `${index === 0 ? 'M' : 'L'} ${index * 20} ${100 - value}`)
    .join(' ');
}

export function timeseriesToSvg(series: LedgerState[]): string {
  const totals = normalise(series.map((point) => point.totalSupply));
  const circulating = normalise(series.map((point) => point.circulating));

  const totalPath = pointsToPath(totals);
  const circulatingPath = pointsToPath(circulating);

  return [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 120">',
    '  <style>text{font-family:monospace;font-size:10px;} .line{fill:none;stroke-width:2;}</style>',
    '  <rect width="400" height="120" fill="#0b1021" rx="8" />',
    '  <path class="line" stroke="#6ee7b7" d="' + totalPath + '" />',
    '  <path class="line" stroke="#60a5fa" d="' + circulatingPath + '" />',
    '  <text x="12" y="18" fill="#6ee7b7">Total</text>',
    '  <text x="12" y="34" fill="#60a5fa">Circulating</text>',
    '</svg>'
  ].join('\n');
}
