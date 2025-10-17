const { getMaintenanceConfig } = require('../lib/maintenanceConfig');

const SPECIAL_CASES = {
  'POST /secrets/materialize': {
    status: 403,
    body: {
      code: 'materialize_disabled',
      message: 'Token minting disabled (global switch).',
    },
    includeRetryAfter: false,
  },
  'POST /secrets/resolve': {
    status: 503,
    body: {
      code: 'maintenance_mode',
      message: 'Secret operations are disabled by the global switch.',
    },
    includeRetryAfter: false,
  },
  'POST /fossil/override': {
    status: 503,
    body: {
      code: 'maintenance_mode',
      message: 'Overrides are disabled while AutoPal is paused.',
    },
    includeRetryAfter: false,
  },
};

function normalizePath(pathname) {
  if (!pathname) return '/';
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.replace(/\/+$/, '');
  }
  return pathname;
}

function buildKey(method, pathname) {
  return `${method.toUpperCase()} ${normalizePath(pathname)}`;
}

function toAllowlistSet(config) {
  const allowlist = new Set();
  const entries = config.maintenance_mode?.allowlist_endpoints || [];
  for (const entry of entries) {
    if (!entry || typeof entry !== 'string') continue;
    const [method, ...rest] = entry.trim().split(/\s+/);
    if (!rest.length) continue;
    const normalized = buildKey(method, rest.join(' '));
    allowlist.add(normalized);
  }
  return allowlist;
}

function isAllowlisted(method, pathname, allowlist) {
  const key = buildKey(method, pathname);
  if (allowlist.has(key)) return true;
  if (method.toUpperCase() === 'HEAD') {
    const altKey = buildKey('GET', pathname);
    if (allowlist.has(altKey)) return true;
  }
  return false;
}

function shouldBypassWithBreakGlass(req, maintenanceConfig, logger) {
  const breakGlass = maintenanceConfig?.break_glass;
  if (!breakGlass || breakGlass.enabled === false) {
    return { allowed: false, attempted: false };
  }

  const headerName = breakGlass.header || 'X-Break-Glass';
  const token = req.get(headerName);
  if (!token) {
    return { allowed: false, attempted: false };
  }

  const tokens = Array.isArray(breakGlass.tokens) ? breakGlass.tokens : [];
  const now = Date.now();
  const matched = tokens.find((entry) => {
    if (!entry) return false;
    if (typeof entry === 'string') {
      return entry === token;
    }
    if (typeof entry === 'object') {
      const value = entry.token || entry.value || entry.signature;
      if (!value || value !== token) {
        return false;
      }
      if (entry.expires_at) {
        const expires = new Date(entry.expires_at).getTime();
        if (Number.isNaN(expires) || expires <= now) {
          return false;
        }
      }
      if (entry.ttl_seconds) {
        const issuedAt = entry.issued_at
          ? new Date(entry.issued_at).getTime()
          : undefined;
        if (issuedAt && !Number.isNaN(issuedAt)) {
          if (issuedAt + Number(entry.ttl_seconds) * 1000 <= now) {
            return false;
          }
        }
      }
      return true;
    }
    return false;
  });

  if (matched) {
    try {
      logger?.info?.({
        event: 'maintenance_break_glass',
        method: req.method,
        path: req.originalUrl ? req.originalUrl.split('?')[0] : req.path,
      });
    } catch (_) {
      // ignore logging errors
    }
    return { allowed: true, attempted: true };
  }

  return { allowed: false, attempted: true };
}

module.exports = function maintenanceGuard({ logger } = {}) {
  return function maintenanceGuardMiddleware(req, res, next) {
    const config = getMaintenanceConfig();
    if (config.feature_flags?.global_enabled !== false) {
      return next();
    }

    const allowlist = toAllowlistSet(config);
    const breakGlass = shouldBypassWithBreakGlass(
      req,
      config.maintenance_mode,
      logger
    );

    if (breakGlass.allowed) {
      res.setHeader('X-AutoPal-Mode', 'maintenance');
      return next();
    }

    if (isAllowlisted(req.method, req.path, allowlist)) {
      res.setHeader('X-AutoPal-Mode', 'maintenance');
      return next();
    }

    const key = buildKey(req.method, req.path);
    const specialCase = SPECIAL_CASES[key];
    const maintenanceSettings = config.maintenance_mode || {};

    res.setHeader('X-AutoPal-Mode', 'maintenance');

    const status = specialCase?.status || maintenanceSettings.status_code || 503;
    const includeRetryAfter =
      specialCase?.includeRetryAfter !== undefined
        ? specialCase.includeRetryAfter
        : status === 503;

    if (includeRetryAfter && status === 503) {
      const retryAfter = maintenanceSettings.retry_after_seconds;
      if (retryAfter) {
        res.setHeader('Retry-After', String(retryAfter));
      }
    }

    const defaultBody = {
      code: 'maintenance_mode',
      message:
        maintenanceSettings.message || 'AutoPal is paused by ops.',
      hint: maintenanceSettings.hint || 'Try again later or use runbooks.',
      runbook:
        maintenanceSettings.runbook ||
        'https://runbooks/autopal/maintenance',
    };

    const body = specialCase?.body || defaultBody;

    try {
      logger?.warn?.({
        event: 'maintenance_block',
        method: req.method,
        path: req.originalUrl ? req.originalUrl.split('?')[0] : req.path,
        status,
        breakGlassAttempted: breakGlass.attempted,
      });
    } catch (_) {
      // Never block on audit/logging failures during maintenance.
    }

    return res.status(status).json(body);
  };
};
