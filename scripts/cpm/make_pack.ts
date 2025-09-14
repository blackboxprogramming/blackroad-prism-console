import fs from 'fs';
const dir='data/cpm/packs'; fs.mkdirSync(dir,{recursive:true});
const period=new Date().toISOString().slice(0,7).replace('-','');
fs.writeFileSync(`${dir}/BOARD_${period}.md`, `# Board Pack ${period}\n\n- Drivers\n- Forecast\n- Variance\n`);
console.log('board pack written');
