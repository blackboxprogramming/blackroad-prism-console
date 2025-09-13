import { Pact } from '@pact-foundation/pact';
import path from 'path';
import fetch from 'node-fetch';

const provider = new Pact({ consumer: 'BlackRoadSDK', provider: 'BlackRoadAPI', dir: path.resolve(process.cwd(), 'contracts/pacts') });

(async () => {
  await provider.setup();
  await provider.addInteraction({
    state: 'partner can enqueue',
    uponReceiving: 'enqueue event',
    withRequest: { method: 'POST', path: '/api/partner/enqueue', headers: { 'Content-Type':'application/json', 'x-br-key':'abc' }, body: { url: 'https://example.com', event: 'test', data: {} } },
    willRespondWith: { status: 200, body: { ok: true } }
  });
  const res = await fetch(provider.mockService.baseUrl + '/api/partner/enqueue', { method:'POST', headers:{'Content-Type':'application/json','x-br-key':'abc'}, body: JSON.stringify({url:'https://example.com',event:'test',data:{}}) });
  if (res.status !== 200) process.exit(1);
  await provider.verify(); await provider.finalize();
})();
