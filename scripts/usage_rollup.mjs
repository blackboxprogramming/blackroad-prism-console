import fs from 'node:fs';
import path from 'node:path';

function currentFile(){
  const month = new Date().toISOString().slice(0,7).replace('-','');
  return path.join('data','metering',`usage-${month}.jsonl`);
}

const f = currentFile();
const out = {};
if (fs.existsSync(f)) {
  const rows = fs.readFileSync(f,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l));
  for (const r of rows) {
    out[r.key] ||= { total:0, routes:{} };
    out[r.key].total++;
    out[r.key].routes[r.route] = (out[r.key].routes[r.route]||0)+1;
  }
}
process.stdout.write(JSON.stringify(out,null,2));
