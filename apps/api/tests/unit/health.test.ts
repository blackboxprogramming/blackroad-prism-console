import assert from 'node:assert/strict';
import http from 'node:http';
import { mkServer } from '../helpers/test_server.ts';

test('GET /api/health returns ok', async () => {
  const srv = mkServer(); const addr = srv.address(); const port = typeof addr==='object' && addr ? addr.port : 0;
  const res: any = await new Promise(r => http.get(`http://127.0.0.1:${port}/api/health`, r));
  assert.equal(res.statusCode, 200); srv.close();
});
