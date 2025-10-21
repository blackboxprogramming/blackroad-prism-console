
import fs from 'fs';
const OPP='crm/opps.json', STG='crm/stages.json';
const opps=fs.existsSync(OPP)? JSON.parse(fs.readFileSync(OPP,'utf-8')).opps||{}:{};
const stages=fs.existsSync(STG)? JSON.parse(fs.readFileSync(STG,'utf-8')).stages||[]:[];
const byStage:Record<string,number>={}; Object.values(opps).forEach((o:any)=>{ byStage[o.stage||'Unstaged']=(byStage[o.stage||'Unstaged']||0)+Number(o.amount||0); });
const md = `# Pipeline Health ${new Date().toISOString().slice(0,7)}\n\n` + stages.map((s:any)=>`- ${s.name}: ${byStage[s.name]||0}`).join('\n') + '\n';
fs.mkdirSync('crm/reports',{recursive:true}); fs.writeFileSync(`crm/reports/PIPE_${new Date().toISOString().slice(0,7).replace('-','')}.md`, md);
console.log('pipeline health written');
