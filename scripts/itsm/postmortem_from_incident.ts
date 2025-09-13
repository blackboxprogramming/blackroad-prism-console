import fs from 'fs';
import path from 'path';

const id = process.argv[2] || '';
if (!id) { console.error('usage: postmortem_from_incident <id>'); process.exit(1); }

function readJSONL(file:string){ if (!fs.existsSync(file)) return []; return fs.readFileSync(file,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)); }

const incs = readJSONL('data/itsm/incidents.jsonl');
const inc = incs.find((x:any)=>x.id===id);
if (!inc) { console.error('not found'); process.exit(1); }

const tl = readJSONL(path.join('data/itsm/timeline', `${id}.jsonl`))
  .map((e:any)=> `- ${new Date(e.ts).toISOString()} — ${e.msg}`).join('\n');

let tpl = fs.readFileSync('itsm/postmortems/template.md','utf-8');
tpl = tpl.replaceAll('{id}', id)
         .replace('{summary}', inc.summary)
         .replace('{sev}', inc.sev)
         .replace('{service}', inc.service)
         .replace('{startIso}', new Date(inc.ts).toISOString())
         .replace('{endIso}', inc.resolvedAt ? new Date(inc.resolvedAt).toISOString() : '<TBD>')
         .replace('{timeline}', tl || '<no events>');

const out = `itsm/postmortems/IM-${id}.md`;
fs.writeFileSync(out, tpl);
console.log(out);
