import fs from 'fs';
const file = 'data/admin/vendors.json';
const items = fs.existsSync(file)? JSON.parse(fs.readFileSync(file,'utf-8')):[];
console.log(`Reminder: ${items.length} vendors require monthly attestation by owners.`);
