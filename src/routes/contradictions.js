'use strict';

const express = require('express');
const db = require('../db');
const { requireAuth, requireAdmin } = require('../auth');

const router = express.Router();

const ALLOWED_STATUSES = new Set(['open', 'investigating', 'resolved']);

const selectSourceByIdentity = db.prepare(
  'SELECT id FROM source WHERE kind = ? AND label = ? AND ifnull(uri, "") = ifnull(?, "")'
);
const insertSource = db.prepare('INSERT INTO source (kind, label, uri) VALUES (?, ?, ?)');

const selectSourceById = db.prepare('SELECT id FROM source WHERE id = ?');

const selectClaimByTopicStatement = db.prepare('SELECT id FROM claim WHERE topic = ? AND statement = ?');
const selectClaimById = db.prepare('SELECT id, topic, statement FROM claim WHERE id = ?');
const insertClaim = db.prepare('INSERT INTO claim (id, topic, statement) VALUES (?, ?, ?)');

const insertObservation = db.prepare(
  `INSERT INTO claim_observation
    (claim_id, source_id, polarity, confidence, note, status, observed_at)
   VALUES (?, ?, ?, ?, ?, ?, COALESCE(?, datetime('now')))`
);

const selectObservationDetail = db.prepare(
  `SELECT o.id,
          o.claim_id,
          o.source_id,
          o.polarity,
          o.confidence,
          o.note,
          o.observed_at,
          o.status,
          s.kind AS source_kind,
          s.label AS source_label,
          s.uri   AS source_uri
     FROM claim_observation o
     JOIN source s ON s.id = o.source_id
    WHERE o.id = ?`
);

const updateObservationStatusOnly = db.prepare(
  'UPDATE claim_observation SET status = ? WHERE id = ?'
);
const updateObservationWithNote = db.prepare(
  'UPDATE claim_observation SET status = ?, note = ? WHERE id = ?'
);

const countClaimsStmt = db.prepare('SELECT COUNT(*) AS count FROM claim');
const countUnresolvedStmt = db.prepare(
  "SELECT COUNT(*) AS count FROM claim_observation WHERE status <> 'resolved'"
);
const selectClaimScoreById = db.prepare('SELECT * FROM claim_score WHERE claim_id = ?');

router.get('/', requireAuth, (req, res) => {
  const topic = normalizeText(req.query.topic);

  let query =
    'SELECT claim_id, topic, statement, support, refute, unknown, observation_count, open_observations, last_observed_at FROM claim_contradictions';
  const params = [];
  if (topic) {
    query += ' WHERE topic = ?';
    params.push(topic);
  }
  query += ' ORDER BY refute DESC, support DESC, last_observed_at DESC LIMIT 200';

  const contradictionsStmt = db.prepare(query);
  const contradictionRows = params.length
    ? contradictionsStmt.all(...params)
    : contradictionsStmt.all();

  const claimIds = contradictionRows.map(row => row.claim_id);
  let observationRows = [];
  if (claimIds.length) {
    const placeholders = claimIds.map(() => '?').join(', ');
    const obsQuery =
      `SELECT o.id,
              o.claim_id,
              o.polarity,
              o.confidence,
              o.note,
              o.observed_at,
              o.status,
              s.kind AS source_kind,
              s.label AS source_label,
              s.uri AS source_uri
         FROM claim_observation o
         JOIN source s ON s.id = o.source_id
        WHERE o.claim_id IN (${placeholders})
        ORDER BY o.observed_at DESC, o.id DESC`;
    observationRows = db.prepare(obsQuery).all(...claimIds);
  }

  const observationsByClaim = new Map();
  for (const obs of observationRows) {
    if (!observationsByClaim.has(obs.claim_id)) {
      observationsByClaim.set(obs.claim_id, []);
    }
    observationsByClaim.get(obs.claim_id).push(obs);
  }

  const totalClaims = countClaimsStmt.get().count;
  const unresolvedObservations = countUnresolvedStmt.get().count;

  const records = contradictionRows.map(row => ({
    ...row,
    observations: observationsByClaim.get(row.claim_id) || []
  }));

  res.json({
    ok: true,
    contradictions: {
      issues: records.length,
      summary: {
        total_claims: totalClaims,
        contradictory_claims: records.length,
        unresolved_observations: unresolvedObservations
      },
      records
    }
  });
});

router.post('/', requireAuth, (req, res) => {
  const payload = req.body || {};

  let claimId = normalizeText(payload.claim_id);
  let topic = normalizeText(payload.topic);
  let statement = normalizeText(payload.statement);
  const moduleName = normalizeText(payload.module);
  const description = normalizeText(payload.description);

  if (!topic && moduleName) {
    topic = moduleName;
  }
  if (!statement && description) {
    statement = description;
  }

  if (!claimId && (!topic || !statement)) {
    return res.status(400).json({ ok: false, error: 'missing_claim' });
  }

  let claimRow;
  if (claimId) {
    claimRow = selectClaimById.get(claimId);
    if (!claimRow) {
      return res.status(404).json({ ok: false, error: 'claim_not_found' });
    }
    topic = claimRow.topic;
    statement = claimRow.statement;
  } else {
    try {
      claimId = ensureClaim(topic, statement);
    } catch (err) {
      return res.status(500).json({ ok: false, error: 'claim_create_failed' });
    }
  }

  const polarity = normalizePolarity(payload.polarity ?? payload.trinary ?? -1);
  if (polarity === null) {
    return res.status(400).json({ ok: false, error: 'invalid_polarity' });
  }

  const confidence = normalizeConfidence(payload.confidence);
  if (confidence === null) {
    return res.status(400).json({ ok: false, error: 'invalid_confidence' });
  }

  const status = normalizeStatus(payload.status);
  if (!status) {
    return res.status(400).json({ ok: false, error: 'invalid_status' });
  }

  const note = normalizeOptionalText(payload.note) ?? description ?? null;
  const observedAt = normalizeOptionalText(payload.observed_at);

  const sourceResolution = resolveSourceId({
    payload,
    moduleName,
    userId: req.user && req.user.id
  });
  if (sourceResolution.error) {
    const status = sourceResolution.error === 'invalid_source_id' ? 400 : 500;
    return res.status(status).json({ ok: false, error: sourceResolution.error });
  }
  const sourceId = sourceResolution.id;

  try {
    const info = insertObservation.run(
      claimId,
      sourceId,
      polarity,
      confidence,
      note,
      status,
      observedAt || null
    );
    const observationId = info.lastInsertRowid;
    const observation = selectObservationDetail.get(observationId);
    const claim = selectClaimScoreById.get(claimId);
    return res.json({ ok: true, observation, claim });
  } catch (err) {
    return res.status(500).json({ ok: false, error: 'observation_create_failed' });
  }
});

router.post('/:observationId/resolve', requireAdmin, (req, res) => {
  const observationId = Number.parseInt(req.params.observationId, 10);
  if (!Number.isInteger(observationId) || observationId <= 0) {
    return res.status(400).json({ ok: false, error: 'invalid_observation_id' });
  }

  const existing = selectObservationDetail.get(observationId);
  if (!existing) {
    return res.status(404).json({ ok: false, error: 'observation_not_found' });
  }

  const rawStatus = req.body ? req.body.status : undefined;
  const nextStatus =
    rawStatus === undefined ? 'resolved' : normalizeStatus(rawStatus);
  if (!nextStatus) {
    return res.status(400).json({ ok: false, error: 'invalid_status' });
  }

  const note = normalizeOptionalText(req.body && req.body.note);

  try {
    if (note !== undefined) {
      updateObservationWithNote.run(nextStatus, note, observationId);
    } else {
      updateObservationStatusOnly.run(nextStatus, observationId);
    }
    const observation = selectObservationDetail.get(observationId);
    const claim = selectClaimScoreById.get(observation.claim_id);
    return res.json({ ok: true, observation, claim });
  } catch (err) {
    return res.status(500).json({ ok: false, error: 'observation_update_failed' });
  }
});

function ensureClaim(topic, statement) {
  const existing = selectClaimByTopicStatement.get(topic, statement);
  if (existing && existing.id) {
    return existing.id;
  }
  const id = cryptoRandomId();
  try {
    insertClaim.run(id, topic, statement);
    return id;
  } catch (err) {
    const retry = selectClaimByTopicStatement.get(topic, statement);
    if (retry && retry.id) {
      return retry.id;
    }
    throw err;
  }
}

function resolveSourceId({ payload, moduleName, userId }) {
  let sourceId = payload && payload.source_id;
  if (sourceId) {
    const row = selectSourceById.get(sourceId);
    return row ? { id: row.id } : { error: 'invalid_source_id' };
  }

  const provided = (payload && payload.source) || {};
  let kind = normalizeText(provided.kind);
  let label = normalizeText(provided.label);
  const uri = normalizeOptionalText(provided.uri);

  if (!kind && moduleName) {
    kind = 'module';
  }
  if (!label && moduleName) {
    label = moduleName;
  }
  if (!kind) {
    kind = 'user';
  }
  if (!label) {
    label = userId ? `user:${userId}` : 'manual';
  }

  let row = selectSourceByIdentity.get(kind, label, uri || null);
  if (row && row.id) {
    return { id: row.id };
  }

  try {
    const info = insertSource.run(kind, label, uri || null);
    row = { id: info.lastInsertRowid };
    return { id: row.id };
  } catch (err) {
    const retry = selectSourceByIdentity.get(kind, label, uri || null);
    if (retry && retry.id) {
      return { id: retry.id };
    }
    return { error: 'source_resolution_failed' };
  }
}

function normalizeText(value) {
  if (value === undefined || value === null) {
    return null;
  }
  const text = String(value).trim();
  return text.length ? text : null;
}

function normalizeOptionalText(value) {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  const text = String(value).trim();
  return text.length ? text : null;
}

function normalizePolarity(value) {
  if (value === undefined || value === null || value === '') {
    return -1;
  }
  const num = Number.parseInt(value, 10);
  if (!Number.isFinite(num) || ![-1, 0, 1].includes(num)) {
    return null;
  }
  return num;
}

function normalizeConfidence(value) {
  if (value === undefined || value === null || value === '') {
    return 1;
  }
  const num = Number.parseFloat(value);
  if (!Number.isFinite(num) || num < 0 || num > 1) {
    return null;
  }
  return Math.round(num * 10000) / 10000;
}

function normalizeStatus(value) {
  if (value === undefined || value === null || value === '') {
    return 'open';
  }
  const status = String(value).trim().toLowerCase();
  return ALLOWED_STATUSES.has(status) ? status : null;
}

router.delete('/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const info = db.prepare('DELETE FROM contradictions WHERE id = ?').run(id);
  if (info.changes === 0) {
    return res.status(404).json({ ok: false, error: 'not_found' });
  }
  res.json({ ok: true });
});

function cryptoRandomId() {
  return require('crypto').randomBytes(16).toString('hex');
}

module.exports = router;
