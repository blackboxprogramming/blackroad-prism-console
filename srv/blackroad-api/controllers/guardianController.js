const logSnapshot = require('../lib/snapshot');

exports.handle = async (_req, res) => {
  const payload = { ok: true, data: { message: 'guardian endpoint' } };
  await logSnapshot(payload);
  res.json(payload);
exports.handle = (req, res) => {
  res.json({ ok: true, message: 'guardian endpoint' });
};
