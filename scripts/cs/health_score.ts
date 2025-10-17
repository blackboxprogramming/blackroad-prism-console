import fs from 'fs';
const H='data/cs/health.jsonl';
if (!fs.existsSync(H)) process.exit(0);
const rows=fs.readFileSync(H,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l));
const period=rows.slice(-1)[0]?.period || new Date().toISOString().slice(0,7);
const byAcc:Record<string,number>={}; rows.filter((r:any)=>r.period===period).forEach((r:any)=>{ byAcc[r.accountId]=r.health; });
const md = `# CS Health ${period}\n\n` + Object.entries(byAcc).map(([a,h])=>`- ${a}: ${h}`).join('\n') + '\n';
fs.mkdirSync('cs/reports',{recursive:true}); fs.writeFileSync(`cs/reports/HEALTH_${period.replace('-','')}.md`, md);
console.log('cs health report written');
