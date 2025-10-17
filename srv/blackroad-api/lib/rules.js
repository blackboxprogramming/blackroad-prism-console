const fs = require('fs');
const path = require('path');
const yaml = require('yaml');
const logger = require('./log');

const RULES_DIR = process.env.RULES_DIR
  ? path.resolve(process.env.RULES_DIR)
  : path.resolve(__dirname, '..', '..', '..', 'rules');

const ruleCache = new Map();
let cachePrimed = false;

function loadRulesFromDisk() {
  let entries = [];
  try {
    entries = fs.readdirSync(RULES_DIR, { withFileTypes: true });
  } catch (err) {
    logger.warn({ event: 'rules_scan_failed', error: String(err) });
    cachePrimed = true;
    return;
  }
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (!entry.name.endsWith('.yaml') && !entry.name.endsWith('.yml')) continue;
    const filePath = path.join(RULES_DIR, entry.name);
    try {
      const raw = fs.readFileSync(filePath, 'utf8');
      const spec = yaml.parse(raw);
      if (spec && typeof spec.id === 'string' && spec.id.trim()) {
        ruleCache.set(spec.id.trim(), { ...spec, __file: filePath });
      }
    } catch (err) {
      logger.warn({ event: 'rules_parse_failed', file: filePath, error: String(err) });
    }
  }
  cachePrimed = true;
}

function ensureCache() {
  if (!cachePrimed) loadRulesFromDisk();
}

function loadRuleById(ruleId) {
  if (!ruleId) return null;
  ensureCache();
  if (ruleCache.has(ruleId)) return ruleCache.get(ruleId);
  // Cache miss: rescan once in case new rule landed after boot.
  cachePrimed = false;
  ensureCache();
  return ruleCache.get(ruleId) || null;
}

function getRuleOwners(ruleId) {
  const rule = loadRuleById(ruleId);
  if (!rule) return [];
  if (Array.isArray(rule.owners)) return rule.owners;
  if (rule.metadata && Array.isArray(rule.metadata.owners)) {
    return rule.metadata.owners;
  }
  return [];
}

function getRuleDocPath(ruleId) {
  const rule = loadRuleById(ruleId);
  if (!rule) return null;
  const metadata = rule.metadata || {};
  const docField =
    metadata.docs_url ||
    metadata.runbook ||
    metadata.doc ||
    metadata.documentation;
  if (typeof docField === 'string' && docField.trim()) {
    return docField.trim();
  }
  return rule.id ? `${rule.id.toLowerCase()}.html` : null;
}

module.exports = { loadRuleById, getRuleOwners, getRuleDocPath };
