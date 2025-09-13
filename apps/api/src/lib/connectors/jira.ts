const auth = (u: string, t: string) => 'Basic ' + Buffer.from(`${u}:${t}`).toString('base64');
export async function createIssue(base: string, user: string, token: string, summary: string, projectKey: string) {
  const res = await fetch(`${base}/rest/api/3/issue`, {
    method: 'POST',
    headers: { 'Authorization': auth(user, token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: { summary, issuetype: { name: 'Bug' }, project: { key: projectKey } } })
  });
  return res.json();
}
export async function commentIssue(base: string, user: string, token: string, key: string, body: string) {
  const res = await fetch(`${base}/rest/api/3/issue/${key}/comment`, {
    method: 'POST',
    headers: { 'Authorization': auth(user, token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ body })
  });
  return res.json();
}
