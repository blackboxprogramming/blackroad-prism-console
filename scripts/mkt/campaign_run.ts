import fs from 'fs';
import fetch from 'node-fetch';

const FILE = 'data/mkt/campaigns.jsonl';

(async () => {
  if (!fs.existsSync(FILE)) {
    process.exit(0);
  }

  const rows = fs
    .readFileSync(FILE, 'utf-8')
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line));

  for (const campaign of rows) {
    if (campaign.state !== 'scheduled' && campaign.state !== 'running') {
      continue;
    }

    // stub send: post to notify endpoint if available
    if (process.env.SLACK_WEBHOOK) {
      await fetch(process.env.SLACK_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: `Campaign ${campaign.name} tick` }),
      }).catch(() => null);
    }
  }

  console.log('Campaign run tick complete.');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
