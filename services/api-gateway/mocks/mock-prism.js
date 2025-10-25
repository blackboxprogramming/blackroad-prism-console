#!/usr/bin/env node
import http from 'http';
import fs from 'fs';
import path from 'path';

const PORT = process.env.PORT || 5052;
const dataPath = path.join(process.cwd(), 'dashboard.json');

const payload = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/api/mobile/dashboard') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(payload));
    return;
  }

  res.writeHead(404);
  res.end();
});

server.listen(PORT, () => console.log(`Mock prism listening on ${PORT}`));
