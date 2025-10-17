import fs from 'fs';
const R='data/exp/results.jsonl'; const ym=new Date().toISOString().slice(0,7).replace('-','');
const items=fs.existsSync(R)? fs.readFileSync(R,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[ ];
const last=items.slice(-1)[0]||{expId:'',results:[]};
const md = `# Experiment Analysis ${ym}\n\n- Exp: ${last.expId}\n` + (last.results||[]).map((r:any)=>`- ${r.variant}: rate=${(r.rate||0).toFixed(4)} (exposures=${r.exposures}, conversions=${r.conversions})`).join('\n') + '\n';
fs.mkdirSync('exp/reports',{recursive:true}); fs.writeFileSync(`exp/reports/EXP_${ym}.md`, md);
console.log('experiment report written');
