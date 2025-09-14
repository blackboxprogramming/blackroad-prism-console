import fs from 'fs';
const DOC='data/knowledge/docs.jsonl', IDX='knowledge/index.json';
if(!fs.existsSync(DOC)) process.exit(0);
const rows=fs.readFileSync(DOC,'utf-8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l));
const spaces:Record<string,any>={};
for(const d of rows){ const s=d.space||'default'; spaces[s]=spaces[s]||{builtAt:Date.now(),count:0,docs:[]}; spaces[s].count++; spaces[s].docs.push({id:d.id,title:d.title}); }
fs.mkdirSync('knowledge',{recursive:true}); fs.writeFileSync(IDX, JSON.stringify({spaces},null,2));
console.log('knowledge index built');
