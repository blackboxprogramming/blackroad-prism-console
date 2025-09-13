import fs from 'fs';
fs.mkdirSync('warehouse/data/stage',{recursive:true});
fs.writeFileSync('warehouse/data/stage/tickets.json','[]');
fs.writeFileSync('warehouse/data/stage/ar.json','[]');
fs.writeFileSync('warehouse/data/stage/utm.json','[]');
console.log('ingest: staged raw files (stub)');
