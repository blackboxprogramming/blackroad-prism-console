import fs from 'fs';
function yyyymm(){ const d=new Date(); return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}`; }
const FILE='data/support/tickets.jsonl';
const rows = fs.existsSync(FILE)? fs.readFileSync(FILE,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[ ];
const month = yyyymm();
const byCh:Record<string,number>={}, byStatus:Record<string,number>={};
rows.forEach((t:any)=>{ byCh[t.channel]=(byCh[t.channel]||0)+1; byStatus[t.status]=(byStatus[t.status]||0)+1; });
const md = `# Support Report ${month}

## Volume by Channel
${Object.entries(byCh).map(([k,v])=>`- ${k}: ${v}`).join('\n')}

## By Status
${Object.entries(byStatus).map(([k,v])=>`- ${k}: ${v}`).join('\n')}
`;
const out = `support/reports/REP_${month}.md`;
fs.mkdirSync('support/reports',{recursive:true}); fs.writeFileSync(out, md);
console.log('Wrote', out);
