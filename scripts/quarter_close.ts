import fetch from 'node-fetch';
import { execSync } from 'node:child_process';

const quarter = process.argv[2] || 'YYYYQX';
const title = `[Quarter Close] ${quarter}`;
const body = `Checklist:
- [ ] Invoices reconciled
- [ ] Dunning resolved or reserved
- [ ] Revenue recognized
- [ ] Expenses accrued
- [ ] Bank rec complete
- [ ] Close posted`;

(async ()=>{
  if (process.env.GITHUB_TOKEN) {
    execSync(`gh issue create -t "${title}" -b "${body}"`, { stdio: 'inherit' });
  }
  if (process.env.SLACK_WEBHOOK) {
    await fetch(process.env.SLACK_WEBHOOK, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({text:`Quarter Close started: ${quarter}`})});
  }
  console.log('Quarter close kickoff complete');
})().catch(e=>{ console.error(e); process.exit(0); });
