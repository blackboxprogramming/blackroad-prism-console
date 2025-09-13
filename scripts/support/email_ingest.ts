import fs from 'fs';
import fetch from 'node-fetch';
// Example: read a local eml.json produced by your email parser and post to ingest
const payloadPath = process.argv[2] || 'email.json';
const body = fs.readFileSync(payloadPath,'utf-8');
fetch('http://localhost:4000/api/support/email/ingest',{ method:'POST', headers:{'Content-Type':'application/json','x-parser-signature':'<REPLACE_WITH_VALID_HMAC>'}, body }).then(r=>r.text()).then(console.log);
