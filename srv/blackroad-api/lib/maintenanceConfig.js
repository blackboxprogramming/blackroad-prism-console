const fs = require('fs');
const path = require('path');
const logger = require('./log');

const DEFAULT_CONFIG = {
  feature_flags: {
    global_enabled: true,
  },
  maintenance_mode: {
    allowlist_endpoints: ['GET /health/live', 'GET /health/ready'],
    status_code: 503,
    retry_after_seconds: 60,
    message: 'AutoPal is paused by ops.',
    hint: 'Try again later or use runbooks.',
    runbook: 'https://runbooks/autopal/maintenance',
    break_glass: {
      enabled: false,
      header: 'X-Break-Glass',
      tokens: [],
    },
  },
};

let cachePath = null;
let cacheMtime = 0;
let cacheConfig = null;

function normalizeAllowlistEntry(entry) {
  if (!entry || typeof entry !== 'string') return null;
  const trimmed = entry.trim();
  if (!trimmed) return null;
  const [method, ...rest] = trimmed.split(/\s+/);
  if (!rest.length) return null;
  const normalizedPath = rest.join(' ').trim() || '/';
  return `${method.toUpperCase()} ${normalizedPath}`;
}

function mergeConfig(base, override) {
  const result = {
    feature_flags: { ...(base.feature_flags || {}) },
    maintenance_mode: {
      ...(base.maintenance_mode || {}),
      allowlist_endpoints: [...(base.maintenance_mode?.allowlist_endpoints || [])],
    },
  };

  if (override?.feature_flags) {
    result.feature_flags = {
      ...result.feature_flags,
      ...override.feature_flags,
    };
  }

  if (override?.maintenance_mode) {
    const { allowlist_endpoints, ...rest } = override.maintenance_mode;
    result.maintenance_mode = {
      ...result.maintenance_mode,
      ...rest,
      allowlist_endpoints: [...result.maintenance_mode.allowlist_endpoints],
    };

    if (Array.isArray(allowlist_endpoints)) {
      const set = new Set(result.maintenance_mode.allowlist_endpoints);
      for (const entry of allowlist_endpoints) {
        const normalized = normalizeAllowlistEntry(entry);
        if (normalized) set.add(normalized);
      }
      result.maintenance_mode.allowlist_endpoints = Array.from(set);
    }
  }

  return result;
}

function readConfigFromDisk(configPath) {
  try {
    const stat = fs.statSync(configPath);
    if (
      cacheConfig &&
      cachePath === configPath &&
      cacheMtime === stat.mtimeMs
    ) {
      return cacheConfig;
    }
    const raw = fs.readFileSync(configPath, 'utf8');
    const parsed = raw ? JSON.parse(raw) : {};
    cachePath = configPath;
    cacheMtime = stat.mtimeMs;
    cacheConfig = parsed;
    return parsed;
  } catch (err) {
    if (err.code !== 'ENOENT') {
      try {
        logger.warn({
          event: 'maintenance_config_read_error',
          message: err.message,
          path: configPath,
        });
      } catch (_) {
        // Swallow logging errors — never block on config read issues.
      }
    }
    cachePath = configPath;
    cacheMtime = 0;
    cacheConfig = null;
    return null;
  }
}

function applyEnvOverrides(config) {
  const result = { ...config };
  result.feature_flags = { ...config.feature_flags };
  result.maintenance_mode = { ...config.maintenance_mode };

  const envGlobal = process.env.AUTOPAL_GLOBAL_ENABLED;
  if (envGlobal !== undefined) {
    const normalized = envGlobal.trim().toLowerCase();
    result.feature_flags.global_enabled = !['false', '0', 'off', 'no'].includes(
      normalized
    );
  }

  const envStatus = process.env.AUTOPAL_MAINTENANCE_STATUS_CODE;
  if (envStatus) {
    const statusCode = Number.parseInt(envStatus, 10);
    if (!Number.isNaN(statusCode) && statusCode > 0) {
      result.maintenance_mode.status_code = statusCode;
    }
  }

  const envRetry = process.env.AUTOPAL_RETRY_AFTER_SECONDS;
  if (envRetry) {
    const retryAfter = Number.parseInt(envRetry, 10);
    if (!Number.isNaN(retryAfter) && retryAfter >= 0) {
      result.maintenance_mode.retry_after_seconds = retryAfter;
    }
  }

  const envAllowlist = process.env.AUTOPAL_ALLOWLIST;
  if (envAllowlist) {
    const set = new Set(result.maintenance_mode.allowlist_endpoints);
    for (const entry of envAllowlist.split(',')) {
      const normalized = normalizeAllowlistEntry(entry);
      if (normalized) set.add(normalized);
    }
    result.maintenance_mode.allowlist_endpoints = Array.from(set);
  }

  return result;
}

function getMaintenanceConfig() {
  const configPath =
    process.env.AUTOPAL_CONFIG_PATH ||
    path.resolve(__dirname, '../../../config/autopal.json');

  const fileConfig = configPath ? readConfigFromDisk(configPath) : null;
  const merged = mergeConfig(DEFAULT_CONFIG, fileConfig || {});
  return applyEnvOverrides(merged);
}

module.exports = {
  DEFAULT_CONFIG,
  getMaintenanceConfig,
};
