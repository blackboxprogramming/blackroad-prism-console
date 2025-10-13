import fs from 'fs';
function yyyymm(){ const d=new Date(); return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}`; }
const out = `marketing/reports/MKT_${yyyymm()}.md`;
fs.mkdirSync('marketing/reports',{recursive:true});
fs.writeFileSync(out, `# Marketing Report ${yyyymm()}\n\n- Segments recomputed\n- Journeys ticked\n- Campaign ticks processed\n`);
console.log('Wrote', out);
