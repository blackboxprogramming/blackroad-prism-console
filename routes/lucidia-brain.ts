<!-- FILE: /srv/blackroad-api/routes/lucidia-brain.ts -->
const express = require('express');
const router = express.Router();
const brain = require('../modules/lucidia-brain/brain');
const sse = require('../modules/lucidia-brain/sse');

router.get('/health', async (req, res) => {
  const info = await brain.health();
  res.json(info);
});

router.post('/session', (req, res) => {
  const { title, flags } = req.body || {};
  const data = brain.create(title, flags);
  res.json(data);
});

router.post('/message', async (req, res) => {
  const { session_id, content, stream } = req.body;
  try {
    if (stream) {
      const streamBody = await brain.message({ session_id, content, stream: true });
      sse.setup(res);
      streamBody.on('data', chunk => sse.send(res, chunk.toString()));
      streamBody.on('end', () => sse.close(res));
    } else {
      const result = await brain.message({ session_id, content, stream: false });
      res.json(result);
    }
  } catch (e) {
    res.status(503).json({ error: e.message });
  }
});

router.post('/memory', (req, res) => {
  const { session_id, key, value } = req.body;
  const out = brain.memoryStore(session_id, key, value);
  res.json(out);
});

router.get('/contradictions', (req, res) => {
  const { session_id } = req.query;
  res.json(brain.listContrads(session_id));
});

router.post('/operators', (req, res) => {
  const { code, name, description } = req.body;
  brain.registerOperator(code, name, description);
  res.json({ ok: true });
});

router.get('/session/:id/export', (req, res) => {
  const data = brain.exportZip(req.params.id);
  res.json(data);
});

module.exports = router;
