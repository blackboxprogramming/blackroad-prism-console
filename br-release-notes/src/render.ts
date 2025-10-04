import { format } from 'date-fns';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Incident } from './incidents.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export interface RenderContext {
  version: string;
  date: Date;
  compareUrl: string;
  bullets: string[];
  groups: Record<string, { sha: string; msg: string }[]>;
  incidents: Incident[];
}

export type TemplateKind = 'api' | 'ui' | 'ingest' | 'infra' | 'dbt';

export function renderTemplate(kind: TemplateKind, ctx: RenderContext) {
  const templatePath = join(__dirname, '..', 'templates', `${kind}.md`);
  const template = readFileSync(templatePath, 'utf8');

  const incidentBlock = ctx.incidents.length
    ? ctx.incidents.map((incident) => `- ${incident.title}`).join('\n')
    : 'none';

  let body = template
    .split('{version}').join(ctx.version)
    .split('{date}').join(format(ctx.date, 'yyyy-MM-dd'))
    .replace('{compare_url}', ctx.compareUrl)
    .replace('{incidents_block}', incidentBlock);

  body = injectHighlights(body, ctx.bullets);

  const changesSummary = buildChangesSummary(ctx.groups);
  if (changesSummary.trim().length > 0) {
    body = `${body.trim()}\n\n## Changes by type\n${changesSummary}`;
  }

  return body.trim() + '\n';
}

function injectHighlights(content: string, bullets: string[]) {
  const lines = content.split('\n');
  const headerIndex = lines.findIndex((line) => line.trim().toLowerCase() === '## highlights');
  if (headerIndex === -1) {
    return content;
  }

  let cursor = headerIndex + 1;
  while (cursor < lines.length && lines[cursor].trim().startsWith('-')) {
    lines.splice(cursor, 1);
  }

  const entries = (bullets.length ? bullets : ['']).map((bullet) => `- ${bullet}`.trimEnd());
  lines.splice(cursor, 0, ...entries);
  return lines.join('\n');
}

function buildChangesSummary(groups: Record<string, { sha: string; msg: string }[]>) {
  const order = ['feat', 'fix', 'docs', 'refactor', 'chore', 'other'];
  const sections: string[] = [];

  for (const key of order) {
    const commits = groups[key] ?? [];
    if (!commits.length) continue;
    const title = key.charAt(0).toUpperCase() + key.slice(1);
    sections.push(`### ${title}`);
    for (const commit of commits) {
      sections.push(`- ${commit.msg} (${commit.sha.slice(0, 7)})`);
    }
  }

  return sections.join('\n');
}
