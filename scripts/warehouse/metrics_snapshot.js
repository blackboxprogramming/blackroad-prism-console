const fs = require('fs');

const snap = {
  ts: Date.now(),
  metrics: { ARR: 1200000, FRTBreaches: 0, FunnelSignup: 1000 }
};

fs.mkdirSync('warehouse/metrics', { recursive: true });
fs.writeFileSync('warehouse/metrics/snapshot.json', JSON.stringify(snap, null, 2));

console.log('metrics snapshot written');
