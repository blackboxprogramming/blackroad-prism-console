import fs from 'fs';
import yaml from 'yaml';
const dir='soc/detections';
const req=['id','title','logsource','detection','severity','tags'];
let ok=true;
if (fs.existsSync(dir)){
  for (const f of fs.readdirSync(dir).filter(x=>x.endsWith('.yaml'))){
    const y=yaml.parse(fs.readFileSync(`${dir}/${f}`,'utf-8'));
    const miss=req.filter(k=>!(k in y));
    if (miss.length){ console.log(`ERROR ${f} missing:`, miss.join(',')); ok=false; }
  }
}
process.exit(ok?0:1);
