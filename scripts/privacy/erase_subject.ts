import fs from 'fs';

const subject = process.argv[2];
if (!subject) { console.error('usage: erase_subject <subjectId>'); process.exit(1); }

function redactJsonl(file:string, key='subjectId'){
  if (!fs.existsSync(file)) return;
  const rows = fs.readFileSync(file,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)).map((x:any)=>{
    if (x[key]===subject) { x.subjectId='[ERASED]'; x.email &&= '[ERASED]'; }
    return x;
  });
  fs.writeFileSync(file, rows.map(x=>JSON.stringify(x)).join('\n')+'\n');
}

redactJsonl('data/privacy/consent.jsonl');
redactJsonl('data/privacy/dsar_queue.jsonl');
console.log('erase-complete');
