import fs from 'fs';
const dir='aiops/reports'; fs.mkdirSync(dir,{recursive:true});
const ym=new Date().toISOString().slice(0,7).replace('-','');
fs.writeFileSync(`${dir}/MODEL_${ym}.md`, `# Model Report ${ym}\n\n- Experiments evaluated\n- Registry updates\n`);
console.log('model report written');
