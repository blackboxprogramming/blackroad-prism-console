export async function upsertLead(token: string, email: string, props: Record<string, any> = {}) {
  const res = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ properties: { email, ...props } })
  });
  return res.json();
}
export async function upsertDeal(token: string, name: string, amount: number, stage: string) {
  const res = await fetch('https://api.hubapi.com/crm/v3/objects/deals', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ properties: { dealname: name, amount, dealstage: stage } })
  });
  return res.json();
}
