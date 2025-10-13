const { execFileSync } = require('node:child_process');

const quarter = process.argv[2] || 'YYYYQX';
const title = `[Quarter Close] ${quarter}`;
const body = `Checklist:
- [ ] Invoices reconciled
- [ ] Dunning resolved or reserved
- [ ] Revenue recognized
- [ ] Expenses accrued
- [ ] Bank rec complete
- [ ] Close posted`;

async function postSlack(message) {
  if (!process.env.SLACK_WEBHOOK) return;
  await fetch(process.env.SLACK_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: message })
  });
}

(async () => {
  if (process.env.GITHUB_TOKEN) {
    execFileSync('gh', ['issue', 'create', '-t', title, '--body', body], { stdio: 'inherit' });
  }

  await postSlack(`Quarter Close started: ${quarter}`);
  console.log('Quarter close kickoff complete');
})().catch(err => {
  console.error(err);
  process.exit(1);
});
