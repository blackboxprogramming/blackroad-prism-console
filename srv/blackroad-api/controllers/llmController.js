const LLM_URL = process.env.LLM_URL || 'http://127.0.0.1:8000';
const logSnapshot = require('../lib/snapshot');

exports.chat = async (req, res, next) => {
  try {
    const upstream = await fetch(LLM_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body || {})
    });
    const text = await upstream.text();
    const payload = { ok: upstream.ok, data: text };
    await logSnapshot(payload);
    res.status(upstream.ok ? 200 : upstream.status).json(payload);
    res.status(upstream.ok ? 200 : upstream.status).type('text/plain').send(text);
  } catch (err) {
    next(err);
  }
};
