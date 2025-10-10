const { getConfig } = require('../config');
const { writeAudit } = require('../logger');
const { increment } = require('../metrics');

function globalSwitchGuard(req, res, next) {
  const config = getConfig();
  if (!config.globalSwitch.enabled) {
    increment('maintenance.block');
    writeAudit({
      action: 'global_switch_block',
      path: req.originalUrl,
      method: req.method,
      reason: 'Global switch disabled',
      trace_id: req.traceId
    });
    res.status(503).json({ message: 'Service temporarily disabled by global switch.' });
    return;
  }
  next();
}

module.exports = {
  globalSwitchGuard
};
