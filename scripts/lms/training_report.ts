import fs from 'fs';
const EN='data/lms/enrollments.jsonl', PR='data/lms/progress.jsonl'; const ym=new Date().toISOString().slice(0,7).replace('-','');
const en=fs.existsSync(EN)? fs.readFileSync(EN,'utf-8').trim().split('\n').filter(Boolean).length:0;
const done=fs.existsSync(PR)? fs.readFileSync(PR,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)).filter((p:any)=>p.status==='completed').length:0;
const md=`# Training ${ym}\n\n- Enrollments: ${en}\n- Completions (module-level): ${done}\n`;
fs.mkdirSync('lms/reports',{recursive:true}); fs.writeFileSync(`lms/reports/TRAINING_${ym}.md`, md);
console.log('lms training report written');
