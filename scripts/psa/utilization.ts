import fs from 'fs';
function yyyymm(){ const d=new Date(); return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}`; }
const TIME='data/psa/time.jsonl';
const rows=fs.existsSync(TIME)?fs.readFileSync(TIME,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[
];
const byUser = rows.reduce((m:any,t:any)=>{ const k=t.userId||'u'; m[k]=m[k]||{billable:0,total:0}; m[k].total+=Number(t.hours||0); if(t.billable) m[k].billable+=Number(t.hours||0); return m; },{});
const md = `# Utilization ${yyyymm()}\n\n` + Object.entries(byUser).map(([u,v]:any)=>`- ${u}: ${(v.billable/(v.total||1)*100).toFixed(1)}%`).join('\n') + '\n';
fs.mkdirSync('psa/reports',{recursive:true}); fs.writeFileSync(`psa/reports/UTIL_${yyyymm()}.md`, md);
console.log('utilization report written');
