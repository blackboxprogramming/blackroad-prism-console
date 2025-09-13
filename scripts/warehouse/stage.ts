import fs from 'fs';
fs.mkdirSync('warehouse/data/stage',{recursive:true});
fs.writeFileSync('warehouse/data/stage/tickets_parsed.json','[]');
console.log('stage: parsed to normalized JSON (stub)');
