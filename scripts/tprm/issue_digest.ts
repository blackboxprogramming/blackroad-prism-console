import fs from 'fs';
const F='data/tprm/issues.jsonl'; if(!fs.existsSync(F)) process.exit(0);
const rows=fs.readFileSync(F,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l));
const ym=new Date().toISOString().slice(0,7).replace('-','');
const total=rows.length, open=rows.filter((r:any)=>r.status==='open').length, crit=rows.filter((r:any)=>r.severity==='critical').length;
const md=`# TPRM Issues ${ym}\n\n- Total: ${total}\n- Open: ${open}\n- Critical: ${crit}\n`;
fs.mkdirSync('tprm/reports',{recursive:true}); fs.writeFileSync(`tprm/reports/ISSUES_${ym}.md`, md);
console.log('tprm issues digest written');
