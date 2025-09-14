import fs from 'fs';
function yyyymm(){ const d=new Date(); return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}`; }
const poP='data/p2p/po.jsonl';
const po = fs.existsSync(poP)? fs.readFileSync(poP,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):
[];
const spend = po.reduce((s,p)=> s + (p.lines||[]).reduce((t,l)=> t + l.qty*l.price,0), 0);
const md = `# Spend Report ${yyyymm()}\n\n- Total PO Spend: ${spend}\n`;
fs.mkdirSync('p2p/reports',{recursive:true}); fs.writeFileSync(`p2p/reports/SPEND_${yyyymm()}.md`, md);
console.log('spend report written');
