import fs from 'fs';
const dir='cons/packs'; fs.mkdirSync(dir,{recursive:true});
const period=new Date().toISOString().slice(0,7).replace('-','');
fs.writeFileSync(`${dir}/CONS_${period}.md`, `# Consolidation Pack ${period}\n\n- TB Import\n- FX Translation\n- IC Eliminations\n- Consolidated TB\n- Close Tasks\n`);
console.log('close pack written');
