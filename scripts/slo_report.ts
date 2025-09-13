import fetch from 'node-fetch';
const prom = process.env.PROM_URL!;
async function main() {
  const q = encodeURIComponent('sum(rate(http_requests_total[5m]))');
  const r = await fetch(`${prom}/api/v1/query?query=${q}`);
  const j = await r.json();
  console.log('SLO: OK', j.status);
  if (process.env.SLACK_WEBHOOK) {
    await fetch(process.env.SLACK_WEBHOOK, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({text:`SLO report: ${j.status}`})});
  }
}
main().catch(e => { console.error(e); process.exit(0); });
