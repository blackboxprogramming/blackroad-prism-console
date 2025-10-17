import fs from 'fs';
const OCC='data/fac/occupancy.jsonl'; const ymd=new Date().toISOString().slice(0,10).replace(/-/g,'');
const count=fs.existsSync(OCC)? fs.readFileSync(OCC,'utf-8').trim().split('\n').filter(Boolean).length:0;
const md=`# Occupancy ${ymd}\n\n- Check-ins: ${count}\n`;
fs.mkdirSync('fac/reports',{recursive:true}); fs.writeFileSync(`fac/reports/OCC_${ymd}.md`, md);
console.log('occupancy report written');
