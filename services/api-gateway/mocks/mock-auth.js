#!/usr/bin/env node
import http from 'http';

const PORT = process.env.PORT || 8081;

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/tokens/verify') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      const { token } = JSON.parse(body || '{}');
      const valid = token === 'allowed';
      res.writeHead(valid ? 200 : 401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ valid, user: valid ? { id: 'mock-user' } : undefined }));
    });
    return;
  }

  res.writeHead(404);
  res.end();
});

server.listen(PORT, () => console.log(`Mock auth listening on ${PORT}`));
