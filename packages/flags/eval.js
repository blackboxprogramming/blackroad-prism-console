const { bucket } = require('./hash');

/**
 * @typedef {import('./types').FlagsDoc} FlagsDoc
 * @typedef {import('./types').FlagContext} FlagContext
 */

function parseDate(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function inWindow(rule, now = new Date()) {
  const start = parseDate(rule.startAt);
  const end = parseDate(rule.endAt);
  if (start && now < start) return false;
  if (end && now > end) return false;
  return true;
}

function normalizeEmail(value) {
  if (!value) return undefined;
  return String(value).trim().toLowerCase();
}

function inSegments(rule, email, segs) {
  if (!rule.segments || rule.segments.length === 0) {
    return true;
  }
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return false;
  const domain = normalizedEmail.split('@')[1] || '';
  for (const segmentName of rule.segments) {
    const entries = (segs && segs[segmentName]) || [];
    for (const entry of entries) {
      const value = normalizeEmail(entry);
      if (!value) continue;
      if (value.startsWith('@')) {
        if (value.slice(1) === domain) return true;
      } else if (value === normalizedEmail) {
        return true;
      }
    }
  }
  return false;
}

function clampPercent(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0;
  if (value < 0) return 0;
  if (value > 100) return 100;
  return value;
}

/**
 * @param {FlagsDoc} doc
 * @param {string} key
 * @param {FlagContext} ctx
 * @returns {boolean}
 */
function isOn(doc, key, ctx = {}) {
  if (!doc || !doc.features || typeof doc.features !== 'object') {
    return false;
  }
  const rule = doc.features[key];
  if (!rule) return false;

  if (!inWindow(rule)) return false;

  if (rule.state === 'on') return true;
  if (rule.state === 'off') return false;

  if (!inSegments(rule, ctx.email, doc.segments)) {
    return false;
  }

  const percent = clampPercent(rule.percent);
  if (percent <= 0) return false;

  const seed = ctx.userId || ctx.email || ctx.reqId || 'anon';
  const result = bucket(`${key}:${seed}`);
  return result < percent;
}

module.exports = { isOn, inWindow, inSegments };
