import fs from 'fs';
const dir='finops/reports'; fs.mkdirSync(dir,{recursive:true});
const ym=new Date().toISOString().slice(0,7).replace('-','');
fs.writeFileSync(`${dir}/FINOPS_${ym}.md`, `# FinOps ${ym}\n\n- Costs ingested\n- Allocations\n- Budgets\n- Anomalies\n- Recommendations\n`);
console.log('finops report written');
