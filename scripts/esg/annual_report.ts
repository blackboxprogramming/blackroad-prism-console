import fs from 'fs';
const dir='esg/reports'; const year=new Date().getFullYear();
fs.mkdirSync(dir,{recursive:true});
fs.writeFileSync(`${dir}/ESG_${year}.md`, `# ESG Report ${year}\n\n- Generated stub\n`);
console.log('annual ESG report written');
