import fetch from 'node-fetch';
import fs from 'fs';

// Example: read API metrics from local file or endpoint
const metrics = JSON.parse(fs.readFileSync('apps/api/dist/metrics.json', 'utf-8') || '{}');

const url = process.env.WAREHOUSE_URL || '';
const token = process.env.WAREHOUSE_TOKEN || '';
async function send() {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ timestamp: Date.now(), metrics })
  });
  console.log(`Warehouse sync status: ${res.status}`);
}
send().catch(e => console.error(e));
