import fs from 'fs';
import fetch from 'node-fetch';

const kpi = JSON.parse(fs.readFileSync('data/kpi/kpi_latest.json','utf-8') || '{}');
const lines = [
  `*Exec Digest*`,
  `ARR: ${kpi.ARR ?? 'n/a'} | NDR: ${kpi.NetDollarRetention ?? 'n/a'}`,
  `Availability: ${kpi.Availability ?? 'n/a'} | P95(ms): ${kpi.P95Latency_ms ?? 'n/a'}`,
  `DAU: ${kpi.DAU ?? 'n/a'}`
];
if (process.env.SLACK_WEBHOOK_EXEC) {
  fetch(process.env.SLACK_WEBHOOK_EXEC, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ text: lines.join('\n') }) })
    .then(()=>console.log('Posted exec digest'))
    .catch(()=>console.log('Digest post failed'));
} else {
  console.log(lines.join('\n'));
}
