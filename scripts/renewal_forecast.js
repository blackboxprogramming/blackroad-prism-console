async function main() {
  const url = process.env.CRM_WAREHOUSE_URL;
  const token = process.env.CRM_WAREHOUSE_TOKEN;
  if (!url || !token) {
    throw new Error('CRM_WAREHOUSE_URL and CRM_WAREHOUSE_TOKEN must be set');
  }

  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    throw new Error(`Warehouse responded with status ${res.status}`);
  }

  const accounts = await res.json();
  const now = Date.now();
  const soon = accounts.filter(account => {
    const date = Date.parse(account.renewalDate);
    const days = Math.floor((date - now) / 86400000);
    return [90, 60, 30].some(target => Math.abs(days - target) <= 1);
  });

  const lines = soon.map(account => `- ${account.name} renews ${account.renewalDate} | ARR $${account.arr} | owner ${account.owner}`);
  const text = lines.length ? `Upcoming renewals:\n${lines.join('\n')}` : 'No upcoming renewals in T-90/60/30 window.';

  if (process.env.SLACK_WEBHOOK) {
    await fetch(process.env.SLACK_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
  } else {
    console.log(text);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(0);
});
