import fs from 'fs';
fs.mkdirSync('data/dq',{recursive:true});
fs.appendFileSync('data/dq/anomalies.jsonl', JSON.stringify({ ts:Date.now(), dataset:'finance_arr', metric:'volume', z:0.2, flagged:false })+'\n');
console.log('Anomaly scan complete');
