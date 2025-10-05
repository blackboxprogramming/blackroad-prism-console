const { getConfig } = require('../config');
const { writeAudit } = require('../logger');

function globalSwitchGuard(req, res, next) {
  const config = getConfig();
  if (!config.globalSwitch.enabled) {
    writeAudit({
      action: 'global_switch_block',
      path: req.originalUrl,
      method: req.method,
      reason: 'Global switch disabled'
    });
    res.status(503).json({ message: 'Service temporarily disabled by global switch.' });
    return;
  }
  next();
}

module.exports = {
  globalSwitchGuard
};
