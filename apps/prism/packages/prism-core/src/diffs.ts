import {PrismDiff} from './types';

const DIFF_METADATA_PREFIXES = ['+++', '---', '@@'];

export type DiffStat = {
  path: string;
  additions: number;
  deletions: number;
  changes: number;
};

export type DiffSummary = {
  files: number;
  additions: number;
  deletions: number;
  changes: number;
};

function isMetadata(line: string) {
  return DIFF_METADATA_PREFIXES.some((prefix) => line.startsWith(prefix));
}

function iteratePatchLines(diff: PrismDiff) {
  const normalized = normalizePatch(diff.patch);
  return normalized.split('\n').filter((line) => line.length > 0);
}

export function normalizePatch(patch: string) {
  return patch.replace(/\r\n/g, '\n');
}

export function diffStat(diff: PrismDiff): DiffStat {
  let additions = 0;
  let deletions = 0;
  for (const line of iteratePatchLines(diff)) {
    if (isMetadata(line)) continue;
    if (line.startsWith('+')) additions += 1;
    else if (line.startsWith('-')) deletions += 1;
  }
  return {
    path: diff.path,
    additions,
    deletions,
    changes: additions + deletions,
  };
}

export function diffHasChanges(diff: PrismDiff) {
  return diffStat(diff).changes > 0;
}

export function summarizeDiffs(diffs: PrismDiff[]): DiffSummary {
  const totals: DiffSummary = {
    files: 0,
    additions: 0,
    deletions: 0,
    changes: 0,
  };
  for (const diff of diffs) {
    const stat = diffStat(diff);
    totals.files += 1;
    totals.additions += stat.additions;
    totals.deletions += stat.deletions;
    totals.changes += stat.changes;
  }
  return totals;
}

export function dedupeDiffs(diffs: PrismDiff[]): PrismDiff[] {
  const byPath = new Map<string, PrismDiff>();
  for (const diff of diffs) {
    byPath.set(diff.path, {...diff, patch: normalizePatch(diff.patch)});
  }
  return Array.from(byPath.values());
}

export function groupDiffsByPath(diffs: PrismDiff[]): Map<string, PrismDiff[]> {
  const map = new Map<string, PrismDiff[]>();
  for (const diff of diffs) {
    const arr = map.get(diff.path);
    if (arr) {
      arr.push(diff);
    } else {
      map.set(diff.path, [diff]);
    }
  }
  return map;
}

export function formatDiffStat(stat: DiffStat) {
  return `${stat.path} | +${stat.additions} -${stat.deletions}`;
}

export function selectDiffs(
  diffs: PrismDiff[],
  predicate: (diff: PrismDiff, stat: DiffStat) => boolean
) {
  return diffs.filter((diff) => predicate(diff, diffStat(diff)));
}
