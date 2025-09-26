function clamp(val, min, max, def) {
  const n = Number(val);
  if (Number.isNaN(n)) return def;
  return Math.max(min, Math.min(max, n));
}

function compute(req, res, next) {
  const body = req.body || {};
  if (typeof body.expr !== 'string') {
    return res.status(400).json({ error: 'BAD_INPUT' });
  }
  const mode = body.mode || 'both';
  if (!['symbolic', 'numeric', 'both'].includes(mode)) {
    return res.status(400).json({ error: 'BAD_INPUT' });
  }
  const precision = clamp(body.precision, 32, 4096, 64);
  const timeout_ms = clamp(body.timeout_ms, 0, 10000, 2000);
  req.mci = { expr: body.expr, mode, vars: body.vars || {}, assumptions: body.assumptions || {}, precision, timeout_ms };
  next();
}

function passthrough(req, res, next) {
  req.mci = req.body || {};
  next();
}

module.exports = {
  compute,
  solve: passthrough,
  autodiff: passthrough,
  explain: passthrough
};
