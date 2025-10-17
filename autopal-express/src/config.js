const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ override: true });

function loadJsonConfig(configPath) {
  try {
    const resolved = path.resolve(configPath);
    const payload = fs.readFileSync(resolved, 'utf8');
    return JSON.parse(payload);
  } catch (error) {
    throw new Error(`Unable to read autopal config at ${configPath}: ${error.message}`);
  }
}

function toBoolean(value, fallback) {
  if (value === undefined) {
    return fallback;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

function buildConfig() {
  const rawPath = process.env.AUTOPAL_CONFIG_PATH || './autopal.config.json';
  const jsonConfig = loadJsonConfig(rawPath);

  const config = {
    port: Number(process.env.PORT || jsonConfig.port || 8080),
    issuer: jsonConfig.issuer,
    jwksUrl: jsonConfig.jwks_url,
    expectedAudiences: jsonConfig.audiences || [],
    breakGlass: {
      enabled: toBoolean(process.env.AUTOPAL_BREAK_GLASS_ENABLED, jsonConfig.break_glass?.enabled ?? false),
      header: process.env.AUTOPAL_BREAK_GLASS_HEADER || jsonConfig.break_glass?.header || 'X-Break-Glass',
      secret: process.env.AUTOPAL_BREAK_GLASS_SECRET || ''
    },
    globalSwitch: (() => {
      const disableAll = toBoolean(process.env.AUTOPAL_DISABLE_ALL, false);
      const baseEnabled = jsonConfig.global_switch?.enabled ?? true;
      return { enabled: !disableAll && baseEnabled };
    })(),
    stepUp: {
      header: process.env.AUTOPAL_STEP_UP_HEADER || jsonConfig.step_up?.header || 'X-Step-Up-Approved'
    },
    dualControl: {
      approverHeader: process.env.AUTOPAL_APPROVER_HEADER || jsonConfig.dual_control?.approver_header || 'X-Dual-Control-Approver'
    },
    rateLimit: {
      points: Number(process.env.AUTOPAL_RATE_LIMIT_POINTS || jsonConfig.rate_limit?.points || 10),
      duration: Number(process.env.AUTOPAL_RATE_LIMIT_DURATION || jsonConfig.rate_limit?.duration || 60)
    },
    auditLogPath: process.env.AUTOPAL_AUDIT_LOG_PATH || path.resolve('./logs/audit.log'),
    redisUrl: process.env.REDIS_URL,
    jwksCacheTtl: Number(process.env.AUTOPAL_JWKS_CACHE_TTL || 300)
  };

  if (!config.issuer) {
    throw new Error('issuer is required in autopal.config.json');
  }
  if (!config.jwksUrl) {
    throw new Error('jwks_url is required in autopal.config.json');
  }
  if (!config.breakGlass.secret && config.breakGlass.enabled) {
    console.warn('AUTOPAL_BREAK_GLASS_SECRET not set while break-glass is enabled. Requests will not be able to break glass.');
  }

  return config;
}

let cachedConfig = buildConfig();

function getConfig() {
  return cachedConfig;
}

function refreshConfig() {
  cachedConfig = buildConfig();
  return cachedConfig;
}

module.exports = {
  getConfig,
  refreshConfig
};
