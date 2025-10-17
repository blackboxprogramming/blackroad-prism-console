import fs from 'fs';

async function main(){
  const out = 'data/feature_store/features/user_profile_v1.jsonl';
  fs.mkdirSync('data/feature_store/features', { recursive: true });
  // example: ingest from Matomo or any analytics endpoint (placeholder)
  const rows = [
    { user_id:'u_2', last_seen:new Date().toISOString(), sessions_30d:3, purchases_30d:0 }
  ];
  for (const r of rows) fs.appendFileSync(out, JSON.stringify(r)+'\n');
  console.log(`Ingested ${rows.length} rows`);
}
main().catch(e=>{ console.error(e); process.exit(0); });
