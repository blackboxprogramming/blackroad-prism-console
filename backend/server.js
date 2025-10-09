const http = require('http');
const data = require('./data');

const PORT = process.env.PORT || 4000;
const HOST = '0.0.0.0';

// Sample credentials for tests
const VALID_USER = {
  username: 'root',
  password: 'Codex2025', // pragma: allowlist secret
  token: 'test-token', // pragma: allowlist secret
};
const tasks = [];

const securitySpotlights = {
  controlBarrier: {
    requiredSlack: 0.18,
    currentSlack: 0.24,
    infeasibilityRate: 0.008,
    interventionsToday: 3,
    lastFailsafe: '2025-03-08T11:24:00.000Z',
    killSwitchEngaged: false,
    manualOverride: false,
  },
  dpAccountant: {
    epsilonCap: 3.5,
    epsilonSpent: 1.62,
    delta: 1e-6,
    releasesToday: 42,
    momentsWindow: 1.2,
    freezeQueries: false,
    syntheticFallback: false,
  },
  pqHandshake: {
    keyRotationMinutes: 45,
    minutesSinceRotation: 32,
    hybridSuccessRate: 0.998,
    kemFailures: 1,
    transcriptPinnedRate: 0.92,
    haltChannel: false,
  },
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function snapshotSpotlights() {
  const ctrl = securitySpotlights.controlBarrier;
  const dp = securitySpotlights.dpAccountant;
  const pq = securitySpotlights.pqHandshake;
  const residualSlack = Math.max(ctrl.currentSlack - ctrl.requiredSlack, 0);
  const residualEpsilon = Math.max(dp.epsilonCap - dp.epsilonSpent, 0);
  const budgetUtilization = dp.epsilonCap > 0 ? dp.epsilonSpent / dp.epsilonCap : 0;
  const timeToRotate = Math.max(pq.keyRotationMinutes - pq.minutesSinceRotation, 0);

  return {
    controlBarrier: {
      ...ctrl,
      residualSlack: Number(residualSlack.toFixed(3)),
    },
    dpAccountant: {
      ...dp,
      residualEpsilon: Number(residualEpsilon.toFixed(3)),
      budgetUtilization: Number(budgetUtilization.toFixed(3)),
    },
    pqHandshake: {
      ...pq,
      timeToRotate,
    },
  };
}

function ensureAuth(req, res) {
  if (req.headers.authorization !== `Bearer ${VALID_USER.token}`) {
    send(res, 401, { error: 'unauthorized' });
    return false;
  }
  return true;
}

function send(res, status, obj) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(obj));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 1e6) req.destroy();
    });
    req.on('end', () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch {
        reject();
      }
    });
  });
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function safeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

data.expireApprovedExceptions();
setInterval(() => {
  try {
    data.expireApprovedExceptions();
  } catch (err) {
    console.error('exception expiry failed', err); // eslint-disable-line no-console
  }
}, ONE_DAY_MS);

const app = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const segments = url.pathname.split('/').filter(Boolean);

  if (req.method === 'POST' && url.pathname === '/api/auth/login') {
    try {
      const body = await parseBody(req);
      if (body.username === VALID_USER.username && body.password === VALID_USER.password) {
        return send(res, 200, { token: VALID_USER.token });
      }
      return send(res, 401, { error: 'invalid credentials' });
    } catch {
      return send(res, 400, { error: 'invalid json' });
    }
  }

  if (req.method === 'POST' && url.pathname === '/api/tasks') {
    if (!ensureAuth(req, res)) return;
    try {
      const body = await parseBody(req);
      if (typeof body.title !== 'string' || !body.title.trim()) {
        return send(res, 400, { error: 'invalid task' });
      }
      const task = { id: tasks.length + 1, title: body.title };
      tasks.push(task);
      return send(res, 201, { ok: true, task });
    } catch {
      return send(res, 400, { error: 'invalid json' });
    }
  }

  if (req.method === 'GET' && url.pathname === '/api/tasks') {
    if (!ensureAuth(req, res)) return;
    return send(res, 200, { tasks });
  }

  if (req.method === 'GET' && url.pathname === '/api/security/spotlights') {
    if (!ensureAuth(req, res)) return;
    return send(res, 200, { spotlights: snapshotSpotlights() });
  }

  if (
    req.method === 'POST'
    && segments[0] === 'api'
    && segments[1] === 'security'
    && segments[2] === 'spotlights'
    && segments.length === 4
  ) {
    if (!ensureAuth(req, res)) return;
    let body;
    try {
      body = await parseBody(req);
    } catch {
      return send(res, 400, { error: 'invalid json' });
    }

    const panelMap = {
      'control-barrier': 'controlBarrier',
      'dp-accountant': 'dpAccountant',
      'pq-handshake': 'pqHandshake',
    };
    const panelKey = panelMap[segments[3]];
    if (!panelKey) {
      return send(res, 404, { error: 'not found' });
    }

    if (panelKey === 'controlBarrier') {
      if (typeof body.requiredSlack === 'number') {
        const value = clamp(body.requiredSlack, 0.05, 0.5);
        securitySpotlights.controlBarrier.requiredSlack = Number(value.toFixed(3));
        if (securitySpotlights.controlBarrier.requiredSlack > securitySpotlights.controlBarrier.currentSlack) {
          securitySpotlights.controlBarrier.currentSlack = Number(
            (securitySpotlights.controlBarrier.requiredSlack + 0.01).toFixed(3),
          );
        }
      }
      if (typeof body.killSwitchEngaged === 'boolean') {
        securitySpotlights.controlBarrier.killSwitchEngaged = body.killSwitchEngaged;
        securitySpotlights.controlBarrier.manualOverride = body.killSwitchEngaged;
        if (body.killSwitchEngaged) {
          securitySpotlights.controlBarrier.currentSlack = Number(
            Math.max(securitySpotlights.controlBarrier.requiredSlack + 0.02, 0.04).toFixed(3),
          );
          securitySpotlights.controlBarrier.interventionsToday += 1;
          securitySpotlights.controlBarrier.lastFailsafe = new Date().toISOString();
        }
      }
      if (body.logIntervention) {
        securitySpotlights.controlBarrier.interventionsToday += 1;
        securitySpotlights.controlBarrier.lastFailsafe = new Date().toISOString();
      }
      if (typeof body.currentSlack === 'number') {
        const value = clamp(body.currentSlack, 0, 0.6);
        securitySpotlights.controlBarrier.currentSlack = Number(value.toFixed(3));
      }
    } else if (panelKey === 'dpAccountant') {
      if (typeof body.epsilonCap === 'number') {
        const value = clamp(body.epsilonCap, 0.5, 15);
        securitySpotlights.dpAccountant.epsilonCap = Number(value.toFixed(2));
        if (securitySpotlights.dpAccountant.epsilonCap < securitySpotlights.dpAccountant.epsilonSpent) {
          securitySpotlights.dpAccountant.epsilonSpent = Number(
            Math.max(securitySpotlights.dpAccountant.epsilonCap - 0.05, 0).toFixed(2),
          );
        }
      }
      if (typeof body.freezeQueries === 'boolean') {
        securitySpotlights.dpAccountant.freezeQueries = body.freezeQueries;
      }
      if (typeof body.syntheticFallback === 'boolean') {
        securitySpotlights.dpAccountant.syntheticFallback = body.syntheticFallback;
      }
      if (typeof body.epsilonSpent === 'number') {
        const value = clamp(body.epsilonSpent, 0, 20);
        securitySpotlights.dpAccountant.epsilonSpent = Number(value.toFixed(3));
      }
    } else if (panelKey === 'pqHandshake') {
      if (typeof body.keyRotationMinutes === 'number') {
        const value = clamp(body.keyRotationMinutes, 5, 240);
        securitySpotlights.pqHandshake.keyRotationMinutes = Math.round(value);
      }
      if (typeof body.haltChannel === 'boolean') {
        securitySpotlights.pqHandshake.haltChannel = body.haltChannel;
      }
      if (body.forceRekey) {
        securitySpotlights.pqHandshake.minutesSinceRotation = 0;
        securitySpotlights.pqHandshake.kemFailures = 0;
      }
      if (typeof body.minutesSinceRotation === 'number') {
        const value = clamp(body.minutesSinceRotation, 0, 240);
        securitySpotlights.pqHandshake.minutesSinceRotation = Math.round(value);
      }
      if (typeof body.hybridSuccessRate === 'number') {
        const value = clamp(body.hybridSuccessRate, 0, 1);
        securitySpotlights.pqHandshake.hybridSuccessRate = Number(value.toFixed(3));
      }
    }

    const snapshot = snapshotSpotlights();
    return send(res, 200, { key: panelKey, spotlight: snapshot[panelKey] });
  }

  if (req.method === 'POST' && url.pathname === '/exceptions') {
    let body;
    try {
      body = await parseBody(req);
    } catch {
      return send(res, 400, { error: 'invalid json' });
    }
    const ruleId = typeof body.rule_id === 'string' && body.rule_id.trim();
    const subjectType = typeof body.subject_type === 'string' && body.subject_type.trim();
    const subjectId = typeof body.subject_id === 'string' && body.subject_id.trim();
    const reason = typeof body.reason === 'string' && body.reason.trim();
    const orgId = safeNumber(body.org_id);
    const requestedBy = safeNumber(body.requested_by);
    if (!ruleId || !subjectType || !subjectId || !reason || orgId == null || requestedBy == null) {
      return send(res, 400, { error: 'invalid exception payload' });
    }
    const validUntil = body.valid_until || null;
    const created = data.createException({
      ruleId,
      orgId,
      subjectType,
      subjectId,
      requestedBy,
      reason,
      validUntil,
    });
    return send(res, 201, created);
  }

  if (req.method === 'POST' && segments[0] === 'exceptions' && segments.length === 3) {
    const exceptionId = safeNumber(segments[1]);
    if (exceptionId == null) {
      return send(res, 404, { error: 'not found' });
    }
    let body;
    try {
      body = await parseBody(req);
    } catch {
      return send(res, 400, { error: 'invalid json' });
    }
    const actor = safeNumber(body.actor);
    if (actor == null) {
      return send(res, 400, { error: 'actor required' });
    }
    const note = typeof body.note === 'string' ? body.note : undefined;
    if (segments[2] === 'approve') {
      const approved = data.approveException(exceptionId, {
        actor,
        note,
        valid_from: body.valid_from,
        valid_until: body.valid_until,
      });
      if (!approved) return send(res, 404, { error: 'not found' });
      return send(res, 200, approved);
    }
    if (segments[2] === 'deny') {
      const denied = data.denyException(exceptionId, { actor, note });
      if (!denied) return send(res, 404, { error: 'not found' });
      return send(res, 200, denied);
    }
    if (segments[2] === 'revoke') {
      const revoked = data.revokeException(exceptionId, { actor, note });
      if (!revoked) return send(res, 404, { error: 'not found' });
      return send(res, 200, revoked);
    }
  }

  if (req.method === 'GET' && url.pathname === '/exceptions') {
    const list = data.listExceptions({
      ruleId: url.searchParams.get('rule_id') || undefined,
      subjectType: url.searchParams.get('subject_type') || undefined,
      subjectId: url.searchParams.get('subject_id') || undefined,
      status: url.searchParams.get('status') || undefined,
    });
    return send(res, 200, { exceptions: list });
  }

  // invalid JSON catch-all
  if (req.method === 'POST') {
    try {
      await parseBody(req);
    } catch {
      return send(res, 400, { error: 'invalid json' });
    }
  }

  send(res, 404, { error: 'not found' });
});

module.exports = { app };

if (require.main === module) {
  app.listen(PORT, HOST, () => {
    // eslint-disable-next-line no-console
    console.log(`Backend listening on http://${HOST}:${PORT}`);
  });
}
