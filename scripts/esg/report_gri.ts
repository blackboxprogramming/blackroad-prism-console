import fs from 'fs';
const dir='data/esg/reports'; fs.mkdirSync(dir,{recursive:true});
const period=new Date().toISOString().slice(0,7);
const md=`# ESG Report ${period}\n\n- Standard: GRI\n- Generated: ${new Date().toISOString()}\n`;
fs.writeFileSync(`${dir}/ESG_${period}.md`, md);
console.log('ESG report generated');
