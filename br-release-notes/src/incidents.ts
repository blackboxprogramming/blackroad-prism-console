import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export interface Incident {
  title: string;
  file: string;
}

export interface LoadIncidentsParams {
  issuesDir: string;
  fromISO: string;
  toISO: string;
}

export function loadIncidents({ issuesDir, fromISO, toISO }: LoadIncidentsParams): Incident[] {
  const from = new Date(fromISO).getTime();
  const to = new Date(toISO).getTime();

  const files = readdirSync(issuesDir).filter((file) => file.endsWith('.md'));
  const incidents: Incident[] = [];

  for (const file of files) {
    const content = readFileSync(join(issuesDir, file), 'utf8');
    const frontMatterDate = content.match(/^date:\s*([^\n]+)/m)?.[1]?.trim();
    const timestamp = frontMatterDate
      ? new Date(frontMatterDate).getTime()
      : new Date(file.replace(/[^0-9]/g, '').slice(0, 8)).getTime();

    if (Number.isNaN(timestamp)) {
      continue;
    }

    if (timestamp >= from && timestamp <= to) {
      const title = content.match(/^title:\s*(.+)$/m)?.[1]?.trim() ?? file;
      incidents.push({ title, file });
    }
  }

  return incidents.sort((a, b) => a.title.localeCompare(b.title));
}
