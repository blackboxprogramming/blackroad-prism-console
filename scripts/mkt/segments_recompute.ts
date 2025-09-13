import fs from 'fs';
import yaml from 'yaml';
const DEF='marketing/segments/definitions.yaml';
const OUT='data/mkt/segments';
const defs = fs.existsSync(DEF)? yaml.parse(fs.readFileSync(DEF,'utf-8')):{segments:{}};
fs.mkdirSync(OUT,{recursive:true});
for(const [key,_] of Object.entries(defs.segments||{})){ fs.writeFileSync(`${OUT}/${key}.json`, JSON.stringify([],null,2)); }
console.log('Segments recomputed (stub).');
