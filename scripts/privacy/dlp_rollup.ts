import fs from 'fs';
const FILE='data/privacy/dlp_findings.jsonl'; if(!fs.existsSync(FILE)) process.exit(0);
const rows=fs.readFileSync(FILE,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l));
const ym=new Date().toISOString().slice(0,7).replace('-','');
const byClass:Record<string,number>={}; rows.forEach((r:any)=>{ const c=r.items?.[0]?.class||r.class||'Unknown'; byClass[c]=(byClass[c]||0)+1; });
const md=`# DLP Rollup ${ym}\n\n` + Object.entries(byClass).map(([k,v])=>`- ${k}: ${v}`).join('\n') + '\n';
fs.mkdirSync('privacy/reports',{recursive:true}); fs.writeFileSync(`privacy/reports/DLP_${ym}.md`, md);
console.log('dlp rollup written');
