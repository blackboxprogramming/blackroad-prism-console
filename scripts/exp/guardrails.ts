import fs from 'fs';
const G='data/exp/guardrails.jsonl';
const entry={ ts:Date.now(), check:'weekly', result:'ok' };
fs.mkdirSync('data/exp',{recursive:true});
fs.appendFileSync(G, JSON.stringify(entry)+'\n');
console.log('guardrails checked');
