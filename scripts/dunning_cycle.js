const fs = require('fs');

async function postSlack(text) {
  if (!process.env.SLACK_WEBHOOK) return;
  await fetch(process.env.SLACK_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });
}

const files = fs.readdirSync('invoices').filter(f => f.endsWith('.json'));

function stageFor(daysPast) {
  if (daysPast < 1) return 'NONE';
  if (daysPast < 7) return 'D1';
  if (daysPast < 14) return 'D2';
  if (daysPast < 21) return 'D3';
  return 'FINAL';
}

(async () => {
  for (const file of files) {
    const inv = JSON.parse(fs.readFileSync(`invoices/${file}`, 'utf-8'));
    if (inv.paid) continue;

    const days = Math.floor((Date.now() - Date.parse(inv.due_at)) / 86400000);
    const stage = stageFor(days);
    if (stage !== 'NONE' && inv.dunning_stage !== stage) {
      inv.dunning_stage = stage;
      fs.writeFileSync(`invoices/${file}`, JSON.stringify(inv, null, 2));
      await postSlack(`Dunning ${stage}: ${inv.id} is ${days}d past due ($${inv.total})`);

      if (process.env.DUNNING_EMAIL_WEBHOOK) {
        await fetch(process.env.DUNNING_EMAIL_WEBHOOK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ invoice: inv, stage })
        });
      }
    }
  }
  console.log('Dunning pass complete');
})().catch(err => {
  console.error(err);
  process.exit(0);
});
