import http from 'node:http';
import { loadAddresses, summarizeAddresses, printDiagnostics } from '../src/config/addresses';

const port = Number(process.env.PORT ?? '8080');

const server = http.createServer((req, res) => {
  if (!req.url) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, error: 'Malformed request' }));
    return;
  }

  if (req.url.startsWith('/healthz')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, node: process.version }));
    return;
  }

  if (req.url.startsWith('/addresses')) {
    const summary = summarizeAddresses(loadAddresses());
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, count: summary.length, addresses: summary }));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ ok: false, error: 'Not Found' }));
});

server.listen(port, () => {
  console.log(`Safe Address Agent listening on port ${port}`);
  printDiagnostics();
});
