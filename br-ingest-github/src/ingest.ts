import { PoolClient } from 'pg';
import { iterIssues } from './gh.js';

export async function ingestRepo(client: PoolClient, repo: string, sinceISO: string, token: string) {
  let total = 0;
  for await (const items of iterIssues(repo, sinceISO, token)) {
    if (!items.length) continue;
    const values:any[] = [];
    const rows = items.map((it:any, i:number) => {
      const b = i*12;
      values.push(
        it.id, repo, it.number, it.title, it.state, !!it.pull_request,
        JSON.stringify(it.labels||[]), it.user?.login||null,
        it.created_at, it.closed_at||null, it.updated_at, JSON.stringify(it)
      );
      return `($${b+1},$${b+2},$${b+3},$${b+4},$${b+5},$${b+6},$${b+7},$${b+8},$${b+9},$${b+10},$${b+11},$${b+12})`;
    }).join(',');
    await client.query(
      `insert into raw_github_issues(id,repo_full,number,title,state,is_pull,labels,author,created_at,closed_at,updated_at,payload)
       values ${rows}
       on conflict (id) do update set
         repo_full=excluded.repo_full, title=excluded.title, state=excluded.state, is_pull=excluded.is_pull,
         labels=excluded.labels, author=excluded.author, created_at=excluded.created_at, closed_at=excluded.closed_at,
         updated_at=excluded.updated_at, payload=excluded.payload`, values);
    total += items.length;
  }
  return total;
}
