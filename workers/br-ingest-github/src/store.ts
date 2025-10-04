import fs from 'fs';
import path from 'path';

export type SourceStatus = 'connecting' | 'connected' | 'error';

export interface SourceRecord {
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

export interface StoredIssue {
  id: number;
  repo_full: string;
  number: number;
  title: string;
  state: string;
  is_pull: boolean;
  labels: string[];
  author: string | null;
  created_at: string;
  closed_at: string | null;
  updated_at: string;
  comments: number;
  payload: unknown;
  sourceIds: string[];
}

interface IssueStoreShape {
  issues: Record<string, StoredIssue>;
}

const DEFAULT_PRISM_DIR = path.resolve(process.cwd(), '..', '..', 'data', 'prism');
const DEFAULT_SSM_DIR = path.resolve(process.cwd(), '..', '..', 'data', 'ssm');

function resolvePrismDir(): string {
  return process.env.PRISM_DATA_DIR ? path.resolve(process.env.PRISM_DATA_DIR) : DEFAULT_PRISM_DIR;
}

function resolveSsmDir(): string {
  return process.env.SSM_MOCK_DIR ? path.resolve(process.env.SSM_MOCK_DIR) : DEFAULT_SSM_DIR;
}

function prismPath(...segments: string[]): string {
  return path.join(resolvePrismDir(), ...segments);
}

function ssmPath(parameter: string): string {
  const cleaned = parameter.replace(/^\/+/, '');
  return path.join(resolveSsmDir(), cleaned);
}

function readJsonFile<T>(file: string, fallback: T): T {
  try {
    if (!fs.existsSync(file)) {
      return fallback;
    }
    const raw = fs.readFileSync(file, 'utf-8');
    if (!raw.trim()) {
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`[store] failed to read ${file}:`, err);
    return fallback;
  }
}

function writeJsonFile(file: string, data: unknown): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

const SOURCES_FILE = prismPath('sources.json');
const REPO_SYNC_FILE = prismPath('github_repo_sync.json');
const ISSUES_FILE = prismPath('raw_github_issues.json');

export function loadSources(): SourceRecord[] {
  return readJsonFile<SourceRecord[]>(SOURCES_FILE, []);
}

export function saveSources(records: SourceRecord[]): void {
  writeJsonFile(SOURCES_FILE, records);
}

export function findSourceById(sourceId: string): SourceRecord | null {
  return loadSources().find((record) => record.id === sourceId) ?? null;
}

export function updateSourceRecord(
  sourceId: string,
  updates: Partial<SourceRecord>
): SourceRecord | null {
  const records = loadSources();
  const index = records.findIndex((record) => record.id === sourceId);
  if (index === -1) {
    return null;
  }
  const next: SourceRecord = {
    ...records[index],
    ...updates,
    updatedAt: updates.updatedAt ?? new Date().toISOString(),
  };
  records[index] = next;
  saveSources(records);
  return next;
}

export function loadRepoSync(): Record<string, string> {
  return readJsonFile<Record<string, string>>(REPO_SYNC_FILE, {});
}

export function saveRepoSync(map: Record<string, string>): void {
  writeJsonFile(REPO_SYNC_FILE, map);
}

export function repoKey(sourceId: string, repo: string): string {
  return `${sourceId}::${repo.toLowerCase()}`;
}

export function getRepoSince(sourceId: string, repo: string): string {
  const map = loadRepoSync();
  return map[repoKey(sourceId, repo)] ?? '1970-01-01T00:00:00.000Z';
}

export async function readSsmParameter(parameterPath: string): Promise<string> {
  const fullPath = ssmPath(parameterPath);
  const raw = await fs.promises.readFile(fullPath, 'utf-8');
  return raw.trim();
}

export function upsertIssuesFile(records: StoredIssue[]): void {
  if (!records.length) {
    return;
  }
  const store = readJsonFile<IssueStoreShape>(ISSUES_FILE, { issues: {} });
  for (const record of records) {
    const key = String(record.id);
    const existing = store.issues[key];
    const sources = new Set<string>([
      ...(existing?.sourceIds ?? []),
      ...(record.sourceIds ?? []),
    ]);
    store.issues[key] = {
      ...(existing ?? record),
      ...record,
      sourceIds: Array.from(sources),
    };
  }
  writeJsonFile(ISSUES_FILE, store);
}
