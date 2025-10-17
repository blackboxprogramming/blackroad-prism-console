import { runOnce } from '../lib/webhooks/deliver.js';
const secret = process.env.WEBHOOK_SIGNING_SECRET || '';
runOnce(secret).then(()=>console.log('ok')).catch(e=>{ console.error(e); process.exit(0); });
