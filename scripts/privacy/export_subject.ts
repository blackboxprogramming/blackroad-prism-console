import fs from 'fs';
import AdmZip from 'adm-zip';

const subject = process.argv[2];
if (!subject) { console.error('usage: export_subject <subjectId>'); process.exit(1); }
const outDir = process.env.PRIVACY_EXPORT_DIR || 'data/privacy/exports';
fs.mkdirSync(outDir, { recursive: true });

function collect(file:string, filter:(x:any)=>boolean){
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)).filter(filter);
}

const consent = collect('data/privacy/consent.jsonl', x => x.subjectId===subject);
const dsarQ   = collect('data/privacy/dsar_queue.jsonl', x => x.subjectId===subject);

const zip = new AdmZip();
zip.addFile('consent.jsonl', Buffer.from(consent.map(x=>JSON.stringify(x)).join('\n')));
zip.addFile('dsar_queue.jsonl', Buffer.from(dsarQ.map(x=>JSON.stringify(x)).join('\n')));

const out = `${outDir}/export_${subject}_${Date.now()}.zip`;
zip.writeZip(out);
console.log(out);
