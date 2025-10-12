const crypto = require('crypto');
const querystring = require('querystring');
const express = require('express');
const logger = require('../lib/log');
const { getRuleOwners, getRuleDocPath } = require('../lib/rules');

const SUBJECT_TYPES = new Set(['repo', 'project', 'user', 'group']);
const DEFAULT_DURATION_HOURS = 24;
const MAX_DURATION_HOURS = 72;
const MIN_DURATION_HOURS = 1;

module.exports = function slackExceptions({ app, db }) {
  if (!app || !db) return;

  const signingSecret = process.env.SLACK_SIGNING_SECRET || '';
  const botToken = process.env.SLACK_BOT_TOKEN || '';
  const channel = process.env.SECOPS_CHANNEL || '';
  const docsBase = (
    process.env.RULE_DOCS_BASE_URL || 'https://docs.blackroad.io/rules'
  ).replace(/\/$/, '');

  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS exception_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rule_id TEXT NOT NULL,
      org_id TEXT NOT NULL,
      subject_type TEXT NOT NULL,
      subject_id TEXT NOT NULL,
      reason TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      requested_by TEXT NOT NULL,
      requested_by_slack_id TEXT,
      valid_until TEXT NOT NULL,
      duration_hours INTEGER NOT NULL,
      owners_display TEXT,
      docs_url TEXT,
      message_ts TEXT,
      message_channel TEXT,
      decision_by TEXT,
      decision_by_slack_id TEXT,
      decision_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `
  ).run();

  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS exception_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exception_id INTEGER NOT NULL,
      event_type TEXT NOT NULL,
      actor TEXT,
      detail TEXT,
      correlation_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `
  ).run();

  // Legacy databases created before event typing shipped were missing the
  // `event_type` column. Running the current code against those installs
  // throws an error when we prepare the insert statement below. Patch the
  // table in place so the API can boot without manual intervention.
  const eventColumns = db.prepare('PRAGMA table_info(exception_events)').all();
  const existingEventCols = new Set(eventColumns.map((col) => col.name));
  const eventColumnDefinitions = {
    event_type: "TEXT NOT NULL DEFAULT 'info'",
    actor: 'TEXT',
    detail: 'TEXT',
    correlation_id: 'TEXT',
  };
  for (const [column, definition] of Object.entries(eventColumnDefinitions)) {
    if (!existingEventCols.has(column)) {
      db.prepare(
        `ALTER TABLE exception_events ADD COLUMN ${column} ${definition}`
      ).run();
    }
  }

  const insertException = db.prepare(
    `
    INSERT INTO exception_requests (
      rule_id, org_id, subject_type, subject_id, reason,
      requested_by, requested_by_slack_id, valid_until, duration_hours,
      owners_display, docs_url
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `
  );
  const findPending = db.prepare(
    `
    SELECT * FROM exception_requests
    WHERE rule_id = ? AND subject_type = ? AND subject_id = ? AND status = 'pending'
    ORDER BY created_at DESC
    LIMIT 1
  `
  );
  const getException = db.prepare(
    'SELECT * FROM exception_requests WHERE id = ?'
  );
  const updateMessage = db.prepare(
    `UPDATE exception_requests
     SET message_ts = ?, message_channel = ?, updated_at = datetime('now')
     WHERE id = ?`
  );
  const updateStatus = db.prepare(
    `UPDATE exception_requests
     SET status = ?, decision_by = ?, decision_by_slack_id = ?,
         decision_at = datetime('now'), updated_at = datetime('now')
     WHERE id = ?`
  );
  const recordEvent = db.prepare(
    `INSERT INTO exception_events (exception_id, event_type, actor, detail, correlation_id)
     VALUES (?, ?, ?, ?, ?)`
  );

  const rawBodyParser = express.raw({ type: '*/*' });
  const emailCache = new Map();

  app.post('/slack/command', rawBodyParser, async (req, res) => {
    const raw =
      req.body instanceof Buffer ? req.body : Buffer.from(req.body || '');
    if (!verifySlack(req, raw)) {
      logger.warn({ event: 'slack_verify_failed', path: req.path });
      return res.status(401).send('invalid signature');
    }
    const params = querystring.parse(raw.toString('utf8'));
    if ((params.command || '').trim() !== '/exception') {
      return res.status(200).send('');
    }
    if (!botToken) {
      return res.status(200).json({
        response_type: 'ephemeral',
        text: 'Slack bot token not configured. Please contact an administrator.',
      });
    }
    const defaults = parseCommandDefaults(params.text || '');
    defaults.reason = defaults.reason || '';
    const view = buildModalView(defaults);
    try {
      await slackFetch('views.open', { trigger_id: params.trigger_id, view });
    } catch (err) {
      logger.error({ event: 'slack_open_modal_failed', error: String(err) });
      return res.status(200).json({
        response_type: 'ephemeral',
        text: 'Unable to open exception form. Try again later.',
      });
    }
    return res.status(200).send('');
  });

  app.post('/slack/interact', rawBodyParser, async (req, res) => {
    const raw =
      req.body instanceof Buffer ? req.body : Buffer.from(req.body || '');
    if (!verifySlack(req, raw)) {
      logger.warn({ event: 'slack_verify_failed', path: req.path });
      return res.status(401).send('invalid signature');
    }
    const body = querystring.parse(raw.toString('utf8'));
    if (!body.payload) {
      return res.status(400).send('missing payload');
    }
    let payload;
    try {
      payload = JSON.parse(body.payload);
    } catch (err) {
      logger.warn({ event: 'slack_payload_parse_failed', error: String(err) });
      return res.status(400).send('invalid payload');
    }

    if (
      payload.type === 'view_submission' &&
      payload.view?.callback_id === 'exception_modal'
    ) {
      const response = await handleViewSubmission(payload);
      return res.status(200).json(response);
    }
    if (payload.type === 'block_actions') {
      await handleBlockActions(payload);
      return res.status(200).json({});
    }
    return res.status(200).json({});
  });

  function verifySlack(req, raw) {
    if (!signingSecret) return true;
    const timestamp = req.headers['x-slack-request-timestamp'];
    const signature = req.headers['x-slack-signature'];
    if (!timestamp || !signature) return false;
    const tsNum = Number(timestamp);
    if (!Number.isFinite(tsNum)) return false;
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - tsNum) > 300) return false;
    const base = `v0:${timestamp}:${raw.toString('utf8')}`;
    const hmac = crypto.createHmac('sha256', signingSecret);
    const digest = `v0=${hmac.update(base).digest('hex')}`;
    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(digest)
      );
    } catch {
      return false;
    }
  }

  function parseCommandDefaults(text) {
    const defaults = {
      rule_id: '',
      org_id: '',
      subject_type: 'repo',
      subject_id: '',
      reason: '',
      valid_for: String(DEFAULT_DURATION_HOURS),
    };
    if (!text) return defaults;
    let remaining = text;
    const extract = (key) => {
      const pattern = new RegExp(`${key}[:=]("[^"]+"|\S+)`, 'i');
      const match = remaining.match(pattern);
      if (!match) return '';
      const value = match[1].replace(/^"|"$/g, '');
      remaining = remaining.replace(match[0], '').trim();
      return value;
    };
    const rule = extract('rule');
    const org = extract('org');
    const subjectRaw = extract('subject');
    const typeRaw = extract('type');
    const duration = extract('duration');
    const reason = remaining.trim();
    if (rule) defaults.rule_id = rule;
    if (org) defaults.org_id = org;
    if (duration) defaults.valid_for = duration;
    if (typeRaw) {
      const normalizedType = typeRaw.toLowerCase();
      if (SUBJECT_TYPES.has(normalizedType)) {
        defaults.subject_type = normalizedType;
      }
    }
    if (subjectRaw) {
      if (subjectRaw.includes(':')) {
        const [maybeType, ...rest] = subjectRaw.split(':');
        const idPart = rest.join(':');
        const normalizedType = maybeType.toLowerCase();
        if (SUBJECT_TYPES.has(normalizedType)) {
          defaults.subject_type = normalizedType;
          defaults.subject_id = idPart;
        } else {
          defaults.subject_id = subjectRaw;
        }
      } else {
        defaults.subject_id = subjectRaw;
      }
    }
    if (reason) defaults.reason = reason;
    return defaults;
  }

  function buildModalView(defaults) {
    return {
      type: 'modal',
      callback_id: 'exception_modal',
      title: { type: 'plain_text', text: 'Request Exception' },
      submit: { type: 'plain_text', text: 'Submit' },
      close: { type: 'plain_text', text: 'Cancel' },
      private_metadata: JSON.stringify(defaults),
      blocks: [
        inputBlock(
          'rule_id',
          'Rule ID',
          textInput('rule_id', defaults.rule_id, true)
        ),
        inputBlock(
          'org_id',
          'Org ID',
          textInput('org_id', defaults.org_id, true)
        ),
        inputBlock(
          'subject_type',
          'Subject Type',
          staticSelect(
            'subject_type',
            Array.from(SUBJECT_TYPES),
            defaults.subject_type
          )
        ),
        inputBlock(
          'subject_id',
          'Subject ID',
          textInput('subject_id', defaults.subject_id, true)
        ),
        inputBlock(
          'valid_for',
          'Duration (hours, 1–72)',
          textInput(
            'valid_for',
            defaults.valid_for || String(DEFAULT_DURATION_HOURS),
            false
          )
        ),
        inputBlock(
          'reason',
          'Reason',
          textArea('reason', defaults.reason || '', true)
        ),
      ],
    };
  }

  function inputBlock(blockId, label, element) {
    return {
      type: 'input',
      block_id: blockId,
      label: { type: 'plain_text', text: label },
      element,
    };
  }

  function textInput(actionId, initialValue, required) {
    const element = { type: 'plain_text_input', action_id: actionId };
    if (initialValue) element.initial_value = initialValue;
    if (required) element.min_length = 1;
    return element;
  }

  function textArea(actionId, initialValue, required) {
    const element = {
      type: 'plain_text_input',
      action_id: actionId,
      multiline: true,
    };
    if (initialValue) element.initial_value = initialValue;
    if (required) element.min_length = 5;
    return element;
  }

  function staticSelect(actionId, options, initial) {
    const elements = options.map((value) => ({
      text: { type: 'plain_text', text: value },
      value,
    }));
    const element = {
      type: 'static_select',
      action_id: actionId,
      options: elements,
    };
    if (initial && SUBJECT_TYPES.has(initial)) {
      element.initial_option = {
        text: { type: 'plain_text', text: initial },
        value: initial,
      };
    }
    return element;
  }

  async function handleViewSubmission(payload) {
    const values = payload.view?.state?.values || {};
    const ruleId = getTextValue(values, 'rule_id', 'rule_id');
    const orgId = getTextValue(values, 'org_id', 'org_id');
    const subjectType =
      getSelectValue(values, 'subject_type', 'subject_type') || 'repo';
    const subjectId = getTextValue(values, 'subject_id', 'subject_id');
    const reason = getTextValue(values, 'reason', 'reason');
    const validForRaw = getTextValue(values, 'valid_for', 'valid_for');

    const errors = {};
    if (!ruleId) errors.rule_id = 'Required';
    if (!orgId) errors.org_id = 'Required';
    if (!subjectId) errors.subject_id = 'Required';
    let duration = parseInt(validForRaw || String(DEFAULT_DURATION_HOURS), 10);
    if (!Number.isFinite(duration)) duration = NaN;
    if (
      Number.isNaN(duration) ||
      duration < MIN_DURATION_HOURS ||
      duration > MAX_DURATION_HOURS
    ) {
      errors.valid_for = 'Enter hours between 1 and 72';
    }
    if ((reason || '').trim().length < 5) {
      errors.reason = 'Please add more context';
    }
    if (!SUBJECT_TYPES.has(subjectType)) {
      errors.subject_type = 'Choose a subject type';
    }
    if (Object.keys(errors).length) {
      return { response_action: 'errors', errors };
    }

    const hrs = duration;
    const validUntil = new Date(Date.now() + hrs * 60 * 60 * 1000);
    const validUntilIso = validUntil.toISOString();
    const requestedBy = displayName(payload.user);
    const requestedById = payload.user?.id || null;

    const owners = getRuleOwners(ruleId);
    const ownersDisplay = await formatOwnersLine(owners);
    const docsUrl = resolveDocsUrl(ruleId);

    const duplicate = findPending.get(ruleId, subjectType, subjectId);
    if (duplicate) {
      recordEvent.run(
        duplicate.id,
        'duplicate_request',
        requestedBy,
        `Duplicate submission ignored: ${reason.trim()}`,
        null
      );
      return { response_action: 'clear' };
    }

    const info = insertException.run(
      ruleId,
      orgId,
      subjectType,
      subjectId,
      reason.trim(),
      requestedBy,
      requestedById,
      validUntilIso,
      hrs,
      ownersDisplay,
      docsUrl
    );
    const record = getException.get(info.lastInsertRowid);
    recordEvent.run(record.id, 'created', requestedBy, reason.trim(), null);

    if (botToken && channel) {
      try {
        const response = await postExceptionCard(record);
        if (response?.ts && response?.channel) {
          updateMessage.run(response.ts, response.channel, record.id);
        }
      } catch (err) {
        logger.error({
          event: 'slack_post_card_failed',
          error: String(err),
          exception_id: record.id,
        });
      }
    } else {
      logger.warn({
        event: 'slack_card_skipped',
        reason: 'missing_token_or_channel',
        exception_id: record.id,
      });
    }

    return { response_action: 'clear' };
  }

  async function handleBlockActions(payload) {
    const action = Array.isArray(payload.actions) ? payload.actions[0] : null;
    if (!action) return;
    let parsedValue = {};
    try {
      parsedValue = action.value ? JSON.parse(action.value) : {};
    } catch {
      parsedValue = {};
    }
    const exceptionId = parsedValue.exception_id;
    if (!exceptionId) return;
    const record = getException.get(exceptionId);
    if (!record) {
      await postResponse(
        payload.response_url,
        ':warning: Exception no longer exists.'
      );
      return;
    }
    if (record.status !== 'pending') {
      await postResponse(
        payload.response_url,
        'That exception request has already been processed.'
      );
      return;
    }
    if (!canApprove(payload.user?.id, record.org_id)) {
      await postResponse(
        payload.response_url,
        ':no_entry: You are not allowed to approve this exception.'
      );
      return;
    }
    const decisionActor = displayName(payload.user);
    const decisionId = payload.user?.id || null;
    const correlationId =
      payload.container?.message_ts || record.message_ts || null;

    let status;
    if (action.action_id === 'approve_exception') {
      status = 'approved';
      recordEvent.run(
        record.id,
        'approved',
        decisionActor,
        'Approved via Slack',
        correlationId
      );
      await postResponse(
        payload.response_url,
        ':white_check_mark: Exception approved.'
      );
    } else if (action.action_id === 'deny_exception') {
      status = 'denied';
      recordEvent.run(
        record.id,
        'denied',
        decisionActor,
        'Denied via Slack',
        correlationId
      );
      await postResponse(payload.response_url, ':no_entry: Exception denied.');
    } else {
      return;
    }

    updateStatus.run(status, decisionActor, decisionId, record.id);
    const updated = getException.get(record.id);
    if (botToken && updated.message_ts && updated.message_channel) {
      try {
        await updateExceptionCard(updated);
      } catch (err) {
        logger.error({
          event: 'slack_update_card_failed',
          error: String(err),
          exception_id: updated.id,
        });
      }
    }
  }

  function getTextValue(values, blockId, actionId) {
    const block = values?.[blockId];
    if (!block) return '';
    const element = block[actionId];
    if (!element) return '';
    if (typeof element.value === 'string') return element.value.trim();
    return '';
  }

  function getSelectValue(values, blockId, actionId) {
    const block = values?.[blockId];
    const element = block?.[actionId];
    if (!element) return '';
    const selected = element.selected_option;
    if (selected && typeof selected.value === 'string') return selected.value;
    return '';
  }

  function displayName(user = {}) {
    return user.real_name || user.username || user.name || user.id || 'unknown';
  }

  function resolveDocsUrl(ruleId) {
    const docPath = getRuleDocPath(ruleId);
    if (!docPath) return null;
    if (/^https?:\/\//i.test(docPath)) return docPath;
    const cleaned = docPath.replace(/^\/+/, '').replace(/^docs\//, '');
    return `${docsBase}/${cleaned}`;
  }

  async function formatOwnersLine(owners) {
    if (!owners || owners.length === 0) return '*Owners:* (none)';
    const parts = [];
    for (const raw of owners) {
      if (typeof raw !== 'string') continue;
      const owner = raw.trim();
      if (!owner) continue;
      if (owner.startsWith('@')) {
        parts.push(owner);
        continue;
      }
      if (owner.includes('@')) {
        const id = await slackUserIdByEmail(owner);
        if (id) parts.push(`<@${id}>`);
        else parts.push(owner);
        continue;
      }
      parts.push(owner);
    }
    if (!parts.length) return '*Owners:* (none)';
    return `*Owners:* ${parts.join(', ')}`;
  }

  async function slackUserIdByEmail(email) {
    const key = email.toLowerCase();
    if (emailCache.has(key)) return emailCache.get(key);
    if (!botToken) {
      emailCache.set(key, null);
      return null;
    }
    try {
      const response = await fetch(
        'https://slack.com/api/users.lookupByEmail',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            Authorization: `Bearer ${botToken}`,
          },
          body: JSON.stringify({ email }),
        }
      );
      const data = await response.json();
      if (data.ok && data.user?.id) {
        emailCache.set(key, data.user.id);
        return data.user.id;
      }
      emailCache.set(key, null);
      return null;
    } catch (err) {
      logger.warn({
        event: 'slack_lookup_email_failed',
        error: String(err),
        email,
      });
      emailCache.set(key, null);
      return null;
    }
  }

  async function slackFetch(method, payload) {
    const response = await fetch(`https://slack.com/api/${method}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Authorization: `Bearer ${botToken}`,
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok || !data.ok) {
      const error = data.error || response.statusText;
      throw new Error(`slack api ${method} failed: ${error}`);
    }
    return data;
  }

  async function postExceptionCard(record) {
    const blocks = buildBlocks(record);
    const payload = {
      channel,
      text: `Exception request for ${record.rule_id}`,
      blocks,
    };
    return slackFetch('chat.postMessage', payload);
  }

  async function updateExceptionCard(record) {
    const blocks = buildBlocks(record);
    const payload = {
      channel: record.message_channel,
      ts: record.message_ts,
      text: `Exception request ${record.status}`,
      blocks,
    };
    await slackFetch('chat.update', payload);
  }

  function buildBlocks(record) {
    const header = statusHeader(record.status);
    const ownersLine = record.owners_display || '*Owners:* (none)';
    const details = [
      `*Rule:* \`${escapeMrkdwn(record.rule_id)}\``,
      `*Subject:* \`${escapeMrkdwn(`${record.subject_type}:${record.subject_id}`)}\``,
      `*Org:* \`${escapeMrkdwn(record.org_id)}\``,
      `*Until:* ${formatTimestamp(record.valid_until)}`,
      `*Requested by:* ${escapeMrkdwn(record.requested_by || 'unknown')}`,
      `*Reason:* ${escapeMrkdwn(record.reason)}`,
    ].join('\n');
    const blocks = [
      { type: 'section', text: { type: 'mrkdwn', text: header } },
      { type: 'section', text: { type: 'mrkdwn', text: ownersLine } },
      { type: 'section', text: { type: 'mrkdwn', text: details } },
    ];

    const actionElements = [];
    if (record.docs_url) {
      actionElements.push({
        type: 'button',
        text: { type: 'plain_text', text: 'View rule', emoji: true },
        url: record.docs_url,
        action_id: 'open_rule_docs',
      });
    }
    if (record.status === 'pending') {
      actionElements.push({
        type: 'button',
        text: { type: 'plain_text', text: 'Approve', emoji: true },
        style: 'primary',
        action_id: 'approve_exception',
        value: JSON.stringify({ exception_id: record.id }),
      });
      actionElements.push({
        type: 'button',
        text: { type: 'plain_text', text: 'Deny', emoji: true },
        style: 'danger',
        action_id: 'deny_exception',
        value: JSON.stringify({ exception_id: record.id }),
      });
    }
    if (actionElements.length) {
      blocks.push({
        type: 'actions',
        block_id: 'exception_actions',
        elements: actionElements,
      });
    }

    if (record.status !== 'pending' && record.decision_at) {
      const actor = record.decision_by_slack_id
        ? `<@${record.decision_by_slack_id}>`
        : escapeMrkdwn(record.decision_by || 'unknown approver');
      const statusLine =
        record.status === 'approved'
          ? `:white_check_mark: Approved by ${actor} • ${formatTimestamp(record.decision_at)}`
          : `:no_entry: Denied by ${actor} • ${formatTimestamp(record.decision_at)}`;
      blocks.push({
        type: 'context',
        elements: [{ type: 'mrkdwn', text: statusLine }],
      });
    }
    return blocks;
  }

  function statusHeader(status) {
    if (status === 'approved') return ':white_check_mark: Exception approved';
    if (status === 'denied') return ':no_entry: Exception denied';
    return ':shield: New exception request';
  }

  function escapeMrkdwn(text) {
    return String(text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function formatTimestamp(ts) {
    if (!ts) return 'unknown';
    const date = new Date(ts);
    if (Number.isNaN(date.getTime())) return ts;
    const iso = date.toISOString();
    return `${iso.slice(0, 16).replace('T', ' ')} UTC`;
  }

  async function postResponse(responseUrl, text) {
    if (!responseUrl) return;
    try {
      await fetch(responseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({
          text,
          response_type: 'ephemeral',
          replace_original: false,
        }),
      });
    } catch (err) {
      logger.warn({ event: 'slack_response_post_failed', error: String(err) });
    }
  }

  function canApprove(slackUserId, orgId) {
    if (process.env.ALLOW_ANY === '1') return true;
    const allowList = (process.env.SECOPS_APPROVERS || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (slackUserId && allowList.includes(slackUserId)) return true;
    return false;
  }
};
