import assert from 'node:assert/strict';
import http from 'node:http';
import { mkServer } from '../helpers/test_server.ts';

test('GET /api/reco returns recommendation', async () => {
  const srv = mkServer(); const addr = srv.address(); const port = typeof addr==='object' && addr ? addr.port : 0;
  const body = await new Promise<string>(resolve => {
    http.get(`http://127.0.0.1:${port}/api/reco`, res => { let d=''; res.on('data',c=>d+=c); res.on('end',()=>resolve(d)); });
  });
  const json = JSON.parse(body);
  assert.ok(['PRO_PLAN','STARTER_PLAN'].includes(json.recommendation)); srv.close();
});
