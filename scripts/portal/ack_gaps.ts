import fs from 'fs';
const ACK='data/portal/receipts.jsonl', ANN='portal/announcements.json';
const ym=new Date().toISOString().slice(0,7).replace('-','');
let md = `# Ack Gaps ${ym}\n\n`;
if (fs.existsSync(ANN)){
  const anns=JSON.parse(fs.readFileSync(ANN,'utf-8')).items||{};
  const required=Object.values<any>(anns).filter((a:any)=>a.required);
  const acks = fs.existsSync(ACK)? fs.readFileSync(ACK,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[
];
  required.forEach((a:any)=>{ const count=acks.filter((x:any)=>x.ref?.id===a.id).length; md+=`- ${a.id}: ${count} acks\n`; });
}
fs.mkdirSync('portal/reports',{recursive:true});
fs.writeFileSync(`portal/reports/ACK_GAPS_${ym}.md`, md);
console.log('portal ack gaps report written');
