import fs from 'fs';
const dir='revrec/packs'; fs.mkdirSync(dir,{recursive:true});
const period=new Date().toISOString().slice(0,7).replace('-','');
fs.writeFileSync(`${dir}/REV_${period}.md`, `# RevRec Pack ${period}\n\n- Allocations\n- Schedules\n- Journal Entries\n`);
console.log('revrec pack written');
