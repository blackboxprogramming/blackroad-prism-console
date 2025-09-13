import fetch from 'node-fetch';
import fs from 'fs';

// Example: read API metrics from local file or endpoint
const metrics = JSON.parse(fs.readFileSync('apps/api/dist/metrics.json', 'utf-8') || '{}');

// simple rolling average for anomaly detection
const historyPath = 'scripts/warehouse_history.json';
type History = Record<string, number[]>;
let history: History = {};
try {
  history = JSON.parse(fs.readFileSync(historyPath, 'utf-8'));
} catch {
  history = {};
}

const anomalies: Record<string, number> = {};
for (const [key, value] of Object.entries<number>(metrics)) {
  const values = history[key] || [];
  if (values.length) {
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    if (avg && Math.abs(value - avg) / avg > 0.2) {
      anomalies[key] = value;
      console.warn(`Anomaly detected for ${key}: ${value} vs avg ${avg}`);
    }
  }
  values.push(value);
  history[key] = values.slice(-7); // keep last 7 values
}
fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));

const url = process.env.WAREHOUSE_URL || '';
const token = process.env.WAREHOUSE_TOKEN || '';
async function send() {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ timestamp: Date.now(), metrics, anomalies })
  });
  console.log(`Warehouse sync status: ${res.status}`);
}
send().catch(e => console.error(e));
