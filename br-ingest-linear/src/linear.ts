import fetch from 'node-fetch';

export type LinearIssue = {
  id: string;
  number: number;
  identifier: string;
  title: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
  priority?: number | null;
  estimate?: number | null;
  assignee?: { name?: string | null } | null;
  state?: { name?: string | null; type?: string | null } | null;
  team?: { key?: string | null; name?: string | null } | null;
  project?: { name?: string | null } | null;
  labels?: { nodes?: Array<{ name?: string | null }> } | null;
};

type PageInfo = { hasNextPage: boolean; endCursor?: string | null };

export const ISSUES_Q = `
query Issues($teamKey:String!, $updatedAfter:DateTime, $after:String) {
  issues(
    filter:{ team:{ key:{ eq:$teamKey } }, updatedAt:{ gt:$updatedAfter } },
    first: 50, after: $after
  ) {
    nodes {
      id number identifier title description
      createdAt updatedAt completedAt
      priority estimate
      assignee { name }
      state { name type }
      team { key name }
      project { name }
      labels { nodes { name } }
    }
    pageInfo { hasNextPage endCursor }
  }
}`;

export async function* iterIssues(token: string, teamKey: string, updatedAfterISO: string) {
  let after: string | null = null;
  while (true) {
    const res = await fetch('https://api.linear.app/graphql', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: ISSUES_Q, variables: { teamKey, updatedAfter: updatedAfterISO, after } }),
    });
    if (!res.ok) throw new Error(`Linear ${res.status}`);
    const body: any = await res.json();
    const nodes: LinearIssue[] = body?.data?.issues?.nodes ?? [];
    const page: PageInfo = body?.data?.issues?.pageInfo ?? { hasNextPage: false };
    yield nodes;
    if (!page.hasNextPage) break;
    after = page.endCursor ?? null;
  }
}
