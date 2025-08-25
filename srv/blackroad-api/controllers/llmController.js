const LLM_URL = process.env.LLM_URL || 'http://127.0.0.1:8000';

exports.chat = async (req, res, next) => {
  try {
    const upstream = await fetch(LLM_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body || {})
    });
    const text = await upstream.text();
    res.status(upstream.ok ? 200 : upstream.status).type('text/plain').send(text);
  } catch (err) {
    next(err);
  }
};
