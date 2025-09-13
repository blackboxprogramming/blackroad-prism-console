import fs from 'fs';
function yyyymm(){ const d=new Date(); return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}`; }
const Q='data/cpq/quotes.jsonl';
const rows = fs.existsSync(Q)? fs.readFileSync(Q,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[];
const byState:Record<string,number>={}; rows.forEach((q:any)=>{ byState[q.state]=(byState[q.state]||0)+1; });
const md = `# CPQ Report ${yyyymm()}

## Quotes by State
${Object.entries(byState).map(([k,v])=>`- ${k}: ${v}`).join('\n')}
`;
fs.mkdirSync('cpq/reports',{recursive:true});
fs.writeFileSync(`cpq/reports/CPQ_${yyyymm()}.md`, md);
console.log('report written');
