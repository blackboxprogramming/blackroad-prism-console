import fs from 'fs';
const E='data/esg/emissions.jsonl';
if(!fs.existsSync(E)) process.exit(0);
const rows=fs.readFileSync(E,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l));
const last=rows.slice(-1)[0]||{period:'',total:0};
console.log('ESG calc snapshot', last.period, last.total);
