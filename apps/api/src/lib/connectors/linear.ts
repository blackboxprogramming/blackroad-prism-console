export async function createIssue(token: string, teamId: string, title: string, description: string) {
  const q = `mutation($input: IssueCreateInput!){ issueCreate(input:$input){ success issue{ id identifier title } } }`;
  const res = await fetch('https://api.linear.app/graphql', {
    method: 'POST',
    headers: { 'Authorization': token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: q, variables: { input: { teamId, title, description } } })
  });
  return res.json();
}
