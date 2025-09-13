import fetch from 'node-fetch';
const url = process.env.BILLING_EXPORT_URL!;
const budget = JSON.parse(process.env.FINOPS_BUDGET_JSON || '{"monthly_total_usd":0}');
(async () => {
  const res = await fetch(url);
  const data = await res.json();
  const spend = Number(data.month_to_date_usd || 0);
  const total = Number(budget.monthly_total_usd || 0);
  const ok = spend <= total;
  const msg = `FinOps: month-to-date $${spend.toFixed(2)} / budget $${total.toFixed(2)} → ${ok?'OK':'OVER'}`;
  console.log(msg);
  if (process.env.SLACK_WEBHOOK) await fetch(process.env.SLACK_WEBHOOK, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({text: msg})});
})();
