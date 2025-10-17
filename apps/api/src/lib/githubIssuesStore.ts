import { prismDataPath, readJsonFile, writeJsonFile } from './prismData.js';

export interface StoredGithubIssue {
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
  issues: Record<string, StoredGithubIssue>;
}

const ISSUE_FILE = prismDataPath('raw_github_issues.json');
const EMPTY_STORE: IssueStoreShape = { issues: {} };

function loadStore(): IssueStoreShape {
  return readJsonFile<IssueStoreShape>(ISSUE_FILE, EMPTY_STORE);
}

function saveStore(store: IssueStoreShape): void {
  writeJsonFile(ISSUE_FILE, store);
}

export function upsertIssues(records: StoredGithubIssue[]): StoredGithubIssue[] {
  if (!records.length) {
    return [];
  }
  const store = loadStore();
  const updated: StoredGithubIssue[] = [];
  for (const record of records) {
    const key = String(record.id);
    const existing = store.issues[key];
    const mergedSources = new Set<string>([
      ...(existing?.sourceIds ?? []),
      ...(record.sourceIds ?? []),
    ]);
    const next: StoredGithubIssue = {
      ...(existing ?? {}),
      ...record,
      sourceIds: Array.from(mergedSources),
    } as StoredGithubIssue;
    store.issues[key] = next;
    updated.push(next);
  }
  saveStore(store);
  return updated;
}

export function listIssues(): StoredGithubIssue[] {
  const store = loadStore();
  return Object.values(store.issues);
}
