import fs from 'fs';
import yaml from 'yaml';
const FILE='data/support/tickets.jsonl';
const rows = fs.existsSync(FILE)? fs.readFileSync(FILE,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[ ];
const pol = yaml.parse(fs.readFileSync('support/sla_policies.yaml','utf-8'));
const now = Date.now();
const out = rows.filter((t:any)=>t.sla && (now>t.sla.first_response_due || now>t.sla.resolve_due)).map((t:any)=>({id:t.id, overdue: { fr: now>t.sla.first_response_due, res: now>t.sla.resolve_due }}));
fs.writeFileSync('/tmp/sla_overdue.json', JSON.stringify(out,null,2));
console.log('overdue', out.length);
