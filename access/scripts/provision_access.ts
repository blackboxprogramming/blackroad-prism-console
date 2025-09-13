import fetch from 'node-fetch';
const email = process.argv[2];
if(!email) { console.error('email required'); process.exit(1); }
console.log(`Provisioning access for ${email} (stub)`);
