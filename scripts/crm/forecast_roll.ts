
import fs from 'fs';
const OUT='data/crm/forecast.jsonl';
if (!fs.existsSync(OUT)) process.exit(0);
const rows=fs.readFileSync(OUT,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l));
const last=rows.slice(-1)[0]||{};
const md = `# Forecast ${last.period||''}\n\n- Commit: ${last.commit||0}\n- Best: ${last.best||0}\n- Pipeline: ${last.pipeline||0}\n- Total: ${last.total||0}\n`;
fs.mkdirSync('crm/reports',{recursive:true}); fs.writeFileSync(`crm/reports/FC_${new Date().toISOString().slice(0,7).replace('-','')}.md`, md);
console.log('forecast roll written');
