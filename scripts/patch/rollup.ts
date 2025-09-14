import fs from 'fs';
const PL='data/patch/plans.jsonl', EX='data/patch/exec.jsonl';
const plans=fs.existsSync(PL)?fs.readFileSync(PL,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[ ];
const execs=fs.existsSync(EX)?fs.readFileSync(EX,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[ ];
const ym=new Date().toISOString().slice(0,7).replace('-','');
const done=execs.length, planned=plans.length;
const md=`# Patch Rollup ${ym}\n\n- Planned: ${planned}\n- Executed: ${done}\n`;
fs.mkdirSync('patch/reports',{recursive:true}); fs.writeFileSync(`patch/reports/PATCH_${ym}.md`, md);
console.log('patch rollup written');
