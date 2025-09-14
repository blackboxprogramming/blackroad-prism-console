import fs from 'fs';
const SEND='data/portal/sends.jsonl', ACK='data/portal/receipts.jsonl'; const ym=new Date().toISOString().slice(0,7).replace('-','');
const sends = fs.existsSync(SEND)? fs.readFileSync(SEND,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[
];
const acks  = fs.existsSync(ACK)?  fs.readFileSync(ACK,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[
];
const sent = sends.length, acknowledged = acks.length;
const md = `# Engagement ${ym}\n\n- Sends: ${sent}\n- Acknowledgements: ${acknowledged}\n`;
fs.mkdirSync('portal/reports',{recursive:true});
fs.writeFileSync(`portal/reports/ENGAGE_${ym}.md`, md);
console.log('portal engagement report written');
