import fs from 'fs';
const FILE='clm/repo_index.json';
const data=fs.existsSync(FILE)?JSON.parse(fs.readFileSync(FILE,'utf-8')):{docs:[]};
const ym=new Date().toISOString().slice(0,7).replace('-','');
const docs=data.docs||[];
const out=['# Repository Index Report',`Total docs: ${docs.length}`,...docs.slice(0,50).map((d:any)=>`- ${d.contractId||''} ${(d.text||'').slice(0,40)}`)];
fs.mkdirSync('clm/reports',{recursive:true});
fs.writeFileSync(`clm/reports/REPO_${ym}.md`, out.join('\n'));
