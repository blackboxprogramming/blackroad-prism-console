
import fs from 'fs';
const COMM='data/crm/commissions.jsonl';
if (!fs.existsSync(COMM)) process.exit(0);
const rows=fs.readFileSync(COMM,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l));
const last=rows.slice(-1)[0]||{lines:[]};
const total=last.lines.reduce((s:number,l:any)=>s+Number(l.commission||0),0);
const md = `# Commissions ${last.period||''}\n\n` + last.lines.map((l:any)=>`- ${l.owner}: ${l.commission}`).join('\n') + `\n\n- Total: ${total}\n`;
fs.mkdirSync('crm/reports',{recursive:true}); fs.writeFileSync(`crm/reports/COMM_${new Date().toISOString().slice(0,7).replace('-','')}.md`, md);
console.log('commissions report written');
