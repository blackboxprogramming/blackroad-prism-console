import fs from 'fs';
const T='data/support/tickets.jsonl', M='data/support/messages.jsonl'; const ym=new Date().toISOString().slice(0,7).replace('-','');
const tc=fs.existsSync(T)? fs.readFileSync(T,'utf-8').trim().split('\n').filter(Boolean).length:0;
const mc=fs.existsSync(M)? fs.readFileSync(M,'utf-8').trim().split('\n').filter(Boolean).length:0;
const md=`# Volume ${ym}\n\n- Tickets: ${tc}\n- Messages: ${mc}\n`;
fs.mkdirSync('support/reports',{recursive:true}); fs.writeFileSync(`support/reports/VOLUME_${ym}.md`, md);
console.log('volume report written');
