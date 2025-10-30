export async function upsertAccount(instanceUrl: string, token: string, body: any) {
  const res = await fetch(`${instanceUrl}/services/data/v57.0/sobjects/Account`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return res.json();
}
export async function upsertOpportunity(instanceUrl: string, token: string, body: any) {
  const res = await fetch(`${instanceUrl}/services/data/v57.0/sobjects/Opportunity`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return res.json();
}
