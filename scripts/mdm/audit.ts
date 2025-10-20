import fs from 'fs';
const doms=['accounts','contacts','vendors','items'];
const out='mdm/reports'; fs.mkdirSync(out,{recursive:true});
const ym=new Date().toISOString().slice(0,7).replace('-','');
let md = `# MDM Audit ${ym}\n\n`;
for(const d of doms){
  const g=`mdm/golden/${d}.json`; const cnt=fs.existsSync(g)? Object.keys(JSON.parse(fs.readFileSync(g,'utf-8')).records||{}).length : 0;
  md += `- ${d}: golden=${cnt}\n`;
}
fs.writeFileSync(`${out}/MDM_${ym}.md`, md);
console.log('mdm audit written');
