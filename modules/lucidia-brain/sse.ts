<!-- FILE: /srv/blackroad-api/modules/lucidia-brain/sse.ts -->
function setup(res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
}

function send(res, data) {
  res.write(`data: ${data}\n\n`);
}

function close(res) {
  res.write('event: end\n\n');
  res.end();
}

module.exports = { setup, send, close };
