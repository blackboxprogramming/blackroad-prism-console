import fs from 'fs';
import fetch from 'node-fetch';
import { v4 as uuid } from 'uuid';

type Intent = { key:string; match:string[]; action:string; requires_approval?:boolean };
const intents: Intent[] = (() => {
  const y = require('yaml'); return (y.parse(fs.readFileSync('agents/intents.yaml','utf-8'))?.intents)||[];
})();

function detectIntent(text:string): Intent|undefined {
  const t = text.toLowerCase();
  return intents.find(i => i.match.some(m => t.includes(m.toLowerCase())));
}

export function enqueue(text:string, source='cli', user?:string){
  const i = detectIntent(text) || { key:'unknown', action:'noop', match:[] } as Intent;
  const task = { id: uuid(), ts: Date.now(), intent: i.key, action: i.action, source, user, text, status:'queued' };
  fs.mkdirSync('data/agents', { recursive: true });
  fs.appendFileSync('data/agents/queue.jsonl', JSON.stringify(task)+'\n');
import { v4 as uuid } from 'uuid';
import yaml from 'yaml';

type Intent = {
  key: string;
  match: string[];
  action: string;
  requires_approval?: boolean;
};

type ApprovalHint = {
  runId: number;
  token: string;
};

type EnqueueOptions = {
  source?: string;
  user?: string;
  approval?: Partial<ApprovalHint> | null;
};

const intents: Intent[] = (() => {
  const raw = fs.readFileSync('agents/intents.yaml', 'utf-8');
  const parsed = yaml.parse(raw);
  return (parsed?.intents || []) as Intent[];
})();

function detectIntent(text: string): Intent | undefined {
  const normalized = text.toLowerCase();
  return intents.find((intent) =>
    intent.match.some((match) => normalized.includes(match.toLowerCase()))
  );
}

function normalizeApproval(value?: Partial<ApprovalHint> | null, text?: string): ApprovalHint | undefined {
  const candidates: Array<Partial<ApprovalHint> | undefined> = [value || undefined];
  if (text) {
    const combo = text.match(/approval\s*[:=]\s*(\d+)[#:/]([^\s]+)/i);
    if (combo) {
      candidates.push({ runId: Number.parseInt(combo[1], 10), token: combo[2] });
    }
    const runMatch = text.match(/approval[_-]?run\s*[:=]\s*(\d+)/i);
    const tokenMatch = text.match(/approval[_-]?token\s*[:=]\s*([^\s]+)/i);
    if (runMatch && tokenMatch) {
      candidates.push({ runId: Number.parseInt(runMatch[1], 10), token: tokenMatch[1] });
    }
  }

  for (const candidate of candidates) {
    if (!candidate) continue;
    const rawRunId = Array.isArray(candidate.runId)
      ? candidate.runId[0]
      : candidate.runId;
    const rawToken = Array.isArray(candidate.token)
      ? candidate.token[0]
      : candidate.token;
    const runId =
      typeof rawRunId === 'string' ? Number.parseInt(rawRunId, 10) : (rawRunId as number | undefined);
    const token = typeof rawToken === 'string' ? rawToken.trim() : '';
    if (runId && !Number.isNaN(runId) && token) {
      return { runId, token };
    }
  }
  return undefined;
}

function scrubApprovalHints(text: string): string {
  return text
    .replace(/approval[_-]?run\s*[:=]\s*[^\s]+/gi, '')
    .replace(/approval[_-]?token\s*[:=]\s*[^\s]+/gi, '')
    .replace(/approval\s*[:=]\s*\d+[#:/][^\s]+/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function enqueue(text: string, options?: EnqueueOptions) {
  const intent = detectIntent(text) || ({ key: 'unknown', action: 'noop', match: [] } as Intent);
  const source = options?.source || 'cli';
  const user = options?.user;
  const needsApproval = Boolean(intent.requires_approval);
  const approval = normalizeApproval(options?.approval ?? null, text);

  if (needsApproval) {
    if (!approval) {
      const err = new Error('approval_required');
      err.name = 'ApprovalRequiredError';
      throw err;
    }
  }

  const sanitizedText = scrubApprovalHints(text);

  const task: Record<string, any> = {
    id: uuid(),
    ts: Date.now(),
    intent: intent.key,
    action: intent.action,
    source,
    user,
    text: sanitizedText,
    status: 'queued',
    requiresApproval: needsApproval,
  };

  if (needsApproval && approval) {
    task.approval = approval;
  }

  fs.mkdirSync('data/agents', { recursive: true });
  fs.appendFileSync('data/agents/queue.jsonl', JSON.stringify(task) + '\n');
  return task;
}
