const db = require('./db');

function percentile(arr,p){
  if(arr.length===0) return 0;
  const sorted=[...arr].sort((a,b)=>a-b);
  const idx=Math.floor(p/100*sorted.length);
  return sorted[idx];
}

function run(){
  const day=new Date().toISOString().slice(0,10);
  const rows=db.getMetrics('24h');
  const latencies=rows.map(r=>r.latency_ms).filter(Boolean);
  const p50=percentile(latencies,50);
  const p95=percentile(latencies,95);
  const p99=percentile(latencies,99);
  db.db.prepare('REPLACE INTO metrics_rollup(day,metric,p50,p95,p99,count) VALUES (?,?,?,?,?,?)')
    .run(day,'ttfb',p50,p95,p99,latencies.length);
}

run();
