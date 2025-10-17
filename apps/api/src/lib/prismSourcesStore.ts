import fs from 'fs';
import path from 'path';
import { prismDataPath, readJsonFile, writeJsonFile } from './prismData.js';

export type SourceStatus = 'connecting' | 'connected' | 'error';

export interface PrismSourceRecord {
  id: string;
  kind: 'github_pat' | 'github_app';
  status: SourceStatus;
  repos: string[];
  parameterPath: string;
  createdAt: string;
  updatedAt: string;
  lastRunAt?: string | null;
  lastEnqueuedAt?: string | null;
  lastError?: string | null;
  metadata?: Record<string, unknown>;
}

export interface SourceRepoStatus {
  name: string;
  lastSyncedAt: string | null;
}

export interface PrismSourceView extends Omit<PrismSourceRecord, 'repos'> {
  repos: SourceRepoStatus[];
}

const SOURCES_FILE = prismDataPath('sources.json');
const REPO_SYNC_FILE = prismDataPath('github_repo_sync.json');
const INGEST_QUEUE_FILE = prismDataPath('github_ingest_queue.jsonl');

export function repoKey(sourceId: string, repo: string): string {
  return `${sourceId}::${repo.toLowerCase()}`;
}

export function loadSourceRecords(): PrismSourceRecord[] {
  return readJsonFile<PrismSourceRecord[]>(SOURCES_FILE, []);
}

export function saveSourceRecords(records: PrismSourceRecord[]): void {
  writeJsonFile(SOURCES_FILE, records);
}

export function loadRepoSync(): Record<string, string> {
  return readJsonFile<Record<string, string>>(REPO_SYNC_FILE, {});
}

export function saveRepoSync(map: Record<string, string>): void {
  writeJsonFile(REPO_SYNC_FILE, map);
}

function toView(record: PrismSourceRecord, repoSync: Record<string, string>): PrismSourceView {
  return {
    ...record,
    repos: record.repos.map((name) => ({
      name,
      lastSyncedAt: repoSync[repoKey(record.id, name)] ?? null,
    })),
  };
}

export function listSources(): PrismSourceView[] {
  const records = loadSourceRecords();
  const repoSync = loadRepoSync();
  return records.map((record) => toView(record, repoSync));
}

export function getSource(sourceId: string): PrismSourceRecord | null {
  const records = loadSourceRecords();
  return records.find((record) => record.id === sourceId) ?? null;
}

export function insertSource(record: PrismSourceRecord): PrismSourceView {
  const records = loadSourceRecords();
  records.push(record);
  saveSourceRecords(records);
  const repoSync = loadRepoSync();
  record.repos.forEach((repo) => {
    const key = repoKey(record.id, repo);
    if (!repoSync[key]) {
      repoSync[key] = '1970-01-01T00:00:00.000Z';
    }
  });
  saveRepoSync(repoSync);
  return toView(record, repoSync);
}

export function updateSource(
  sourceId: string,
  updates: Partial<PrismSourceRecord>
): PrismSourceView | null {
  const records = loadSourceRecords();
  const index = records.findIndex((record) => record.id === sourceId);
  if (index === -1) {
    return null;
  }
  const next: PrismSourceRecord = {
    ...records[index],
    ...updates,
    updatedAt: updates.updatedAt ?? new Date().toISOString(),
  };
  records[index] = next;
  saveSourceRecords(records);
  const repoSync = loadRepoSync();
  return toView(next, repoSync);
}

export function updateRepoSyncTimes(
  sourceId: string,
  repoTimes: Record<string, string>
): void {
  const repoSync = loadRepoSync();
  Object.entries(repoTimes).forEach(([repo, iso]) => {
    repoSync[repoKey(sourceId, repo)] = iso;
  });
  saveRepoSync(repoSync);
}

export function updateRepoSyncForSources(
  sourceIds: string[],
  repo: string,
  iso: string
): void {
  const repoSync = loadRepoSync();
  sourceIds.forEach((sourceId) => {
    repoSync[repoKey(sourceId, repo)] = iso;
  });
  saveRepoSync(repoSync);
}

export function findSourceIdsForRepo(repo: string): string[] {
  const records = loadSourceRecords();
  const needle = repo.toLowerCase();
  return records
    .filter((record) =>
      record.repos.some((candidate) => candidate.toLowerCase() === needle)
    )
    .map((record) => record.id);
}

export function enqueueIngestTask(entry: {
  sourceId: string;
  repos: string[];
  enqueuedAt: string;
  reason: string;
}): PrismSourceView | null {
  const line = JSON.stringify(entry);
  const dir = path.dirname(INGEST_QUEUE_FILE);
  fs.mkdirSync(dir, { recursive: true });
  fs.appendFileSync(INGEST_QUEUE_FILE, `${line}\n`);
  return updateSource(entry.sourceId, {
    lastEnqueuedAt: entry.enqueuedAt,
  });
}
