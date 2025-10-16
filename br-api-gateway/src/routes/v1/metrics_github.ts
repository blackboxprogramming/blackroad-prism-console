import { FastifyInstance } from 'fastify';
import { db } from '../../util/db.js';
import { parseISO, subDays, formatISO } from 'date-fns';

function parseParam(value: string | undefined, now: Date, fallback: Date) {
  if (!value) return fallback;
  if (value.startsWith('-P')) {
    const match = /^-P(?:(\d+)D)?$/i.exec(value);
    if (match && match[1]) {
      return subDays(now, Number(match[1]));
    }
  }
  const parsed = parseISO(value);
  if (!Number.isNaN(parsed.getTime())) return parsed;
  return fallback;
}

function range(params: any) {
  const now = new Date();
  const from = parseParam(params.from, now, subDays(now, 7));
  const to = parseParam(params.to, now, now);
  return { from: formatISO(from), to: formatISO(to) };
}

export default async function (app: FastifyInstance) {
  app.get('/metrics/github/issues_opened', async (req: any) => {
    const { from, to } = range(req.query);
    const { rows } = await db.query(
      `select date_trunc('day', created_at) as day, count(*) as c
         from raw_github_issues
        where is_pull=false and created_at between $1 and $2
        group by 1 order by 1 asc`, [from, to]);
    return rows.map((r) => ({ t: r.day, v: Number(r.c) }));
  });

  app.get('/metrics/github/issues_closed', async (req: any) => {
    const { from, to } = range(req.query);
    const { rows } = await db.query(
      `select date_trunc('day', closed_at) as day, count(*) as c
         from raw_github_issues
        where is_pull=false and state='closed' and closed_at between $1 and $2
        group by 1 order by 1 asc`, [from, to]);
    return rows.map((r) => ({ t: r.day, v: Number(r.c) }));
  });

  app.get('/metrics/github/open_bugs', async (_req: any) => {
    const { rows } = await db.query(
      `select count(*) as c
         from raw_github_issues i,
              lateral (select array_agg((l->>'name')) as names from jsonb_array_elements(i.labels) l) lab
        where is_pull=false and state='open' and 'bug' = any(lab.names)`);
    const now = new Date().toISOString();
    return [{ t: now, v: Number(rows[0]?.c || 0) }];
  });
}
