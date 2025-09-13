import fs from 'fs';
import fetch from 'node-fetch';

const msg = process.argv.slice(2).join(' ') || 'Incident update';
if (process.env.SLACK_WEBHOOK) {
  await fetch(process.env.SLACK_WEBHOOK, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ text: msg }) }).catch(()=>null);
}
const feed = process.env.STATUS_FEED_PATH || 'apps/status/feed.json';
try{
  const arr = fs.existsSync(feed) ? JSON.parse(fs.readFileSync(feed,'utf-8')) : [];
  arr.push({ ts: new Date().toISOString(), code: 200, message: msg });
  fs.writeFileSync(feed, JSON.stringify(arr, null, 2));
}catch{}
console.log('broadcasted');
