const jwt = require('jsonwebtoken');
const { getConfig } = require('../config');
const { writeAudit } = require('../logger');
const { increment } = require('../metrics');
const { verifyBearerToken } = require('../services/tokenValidator');

function parseBooleanHeader(value) {
  if (value === undefined) {
    return false;
  }
  return ['1', 'true', 'yes', 'approved'].includes(String(value).toLowerCase());
}

function validateBreakGlass(headerValue) {
  const config = getConfig();
  if (!headerValue) {
    return null;
  }
  if (!config.breakGlass.secret) {
    return null;
  }
  try {
    const decoded = jwt.verify(headerValue, config.breakGlass.secret, { algorithms: ['HS256'] });
    return decoded;
  } catch (error) {
    throw new Error(`Invalid break-glass token: ${error.message}`);
  }
}

async function authenticateRequest(req, res, next) {
  try {
    const config = getConfig();
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Bearer token required' });
      return;
    }
    const token = authHeader.slice('Bearer '.length);
    const claims = await verifyBearerToken(token);
    const requestedAudience = req.headers['x-audience'];
    if (config.expectedAudiences.length > 0 && !config.expectedAudiences.includes(requestedAudience)) {
      res.status(403).json({ message: 'Audience not permitted' });
      return;
    }

    let breakGlassContext = null;
    if (config.breakGlass.enabled) {
      const headerValue = req.headers[config.breakGlass.header.toLowerCase()];
      if (headerValue) {
        breakGlassContext = validateBreakGlass(headerValue);
        writeAudit({
          action: 'break_glass',
          subject: claims?.sub,
          audience: requestedAudience,
          details: breakGlassContext,
          trace_id: req.traceId
        });
      }
    }

    if (!breakGlassContext) {
      const stepUpHeader = req.headers[config.stepUp.header.toLowerCase()];
      if (!parseBooleanHeader(stepUpHeader)) {
        increment('step_up.required');
        writeAudit({
          action: 'step_up_required',
          subject: claims?.sub,
          audience: requestedAudience,
          trace_id: req.traceId
        });
        res.status(401).json({ message: 'Step-up approval required' });
        return;
      }

      const approverHeader = req.headers[config.dualControl.approverHeader.toLowerCase()];
      if (!approverHeader) {
        writeAudit({
          action: 'dual_control_missing',
          subject: claims?.sub,
          audience: requestedAudience,
          trace_id: req.traceId
        });
        res.status(403).json({ message: 'Dual-control approval required' });
        return;
      }

      if (claims?.sub && approverHeader === claims.sub) {
        writeAudit({
          action: 'dual_control_rejected',
          subject: claims?.sub,
          audience: requestedAudience,
          reason: 'approver matches requester',
          trace_id: req.traceId
        });
        res.status(403).json({ message: 'Approver must differ from requester' });
        return;
      }
    }

    req.identity = {
      subject: claims?.sub,
      audiences: claims?.aud ? (Array.isArray(claims.aud) ? claims.aud : [claims.aud]) : [],
      breakGlass: Boolean(breakGlassContext),
      breakGlassContext
    };
    next();
  } catch (error) {
    writeAudit({
      action: 'auth_failure',
      error: error.message,
      path: req.originalUrl,
      trace_id: req.traceId
    });
    res.status(401).json({ message: 'Unauthorized', detail: error.message });
  }
}

module.exports = {
  authenticateRequest
};
