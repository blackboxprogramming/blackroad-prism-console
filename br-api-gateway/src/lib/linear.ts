import fetch from 'node-fetch';

const VIEWER_QUERY = `
query { viewer { id name } }
`;

export interface LinearViewer {
  id: string;
  name: string;
}

export async function validateLinearToken(token: string): Promise<LinearViewer> {
  const res = await fetch('https://api.linear.app/graphql', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: VIEWER_QUERY }),
  });

  if (!res.ok) {
    throw new Error(`Linear auth failed with status ${res.status}`);
  }

  const payload: any = await res.json();
  const viewer = payload?.data?.viewer;
  if (!viewer?.id || !viewer?.name) {
    throw new Error('Unexpected Linear response');
  }
  return { id: String(viewer.id), name: String(viewer.name) };
}

export function linearTokenPath(env: string, sourceId: string): string {
  const normalizedEnv = env || 'dev';
  return `/blackroad/${normalizedEnv}/sources/${sourceId}/linear_token`;
}
