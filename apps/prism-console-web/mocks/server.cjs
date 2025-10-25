#!/usr/bin/env node
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 5052;
const payloadPath = path.join(__dirname, 'dashboard.json');

const payload = JSON.parse(fs.readFileSync(payloadPath, 'utf-8'));

const server = http.createServer((req, res) => {
  if (req.url === '/api/mobile/dashboard') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(payload));
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(PORT, () => {
  console.log(`Mock API ready at http://localhost:${PORT}/api/mobile/dashboard`);
});
