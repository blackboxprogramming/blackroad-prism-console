const { open } = require('../lib/sse');

async function streamComplete(req, res){
  const prompt = String(req.query.prompt||'').slice(0, 4000);
  const sse = open(res);
  // TODO: Replace with real model stream. For now, stream a canned reply.
  const demo = `Thinking about: ${prompt}\nThis is a streaming demo.`.split(' ');
  for (const t of demo) { sse.send({ token: t+" " }); await new Promise(r=>setTimeout(r, 40)); }
  sse.send({ done: true }); sse.close();
}
module.exports = { streamComplete };
