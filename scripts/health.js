const http = require('http');
const port = process.env.PORT || 4000;
const req = http.request({ hostname: '127.0.0.1', port, path: '/api/health', method: 'GET' }, (res) => {
  process.exit(res.statusCode === 200 ? 0 : 1);
});
req.on('error', () => process.exit(1));
req.end();
