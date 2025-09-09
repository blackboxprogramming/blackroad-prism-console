const logger = require('./log');

const NORMALIZE_URL = 'http://127.0.0.1:4505/normalize';

module.exports = async function logSnapshot(payload) {
  try {
    const res = await fetch(NORMALIZE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const normalized = await res.json();
    logger.info({ snapshot: normalized });
  } catch (err) {
    logger.error({ snapshotError: String(err) });
  }
};
