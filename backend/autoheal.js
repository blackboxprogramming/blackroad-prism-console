const { store } = require('./data');
const { nowISO } = require('./utils');
const { randomUUID } = require('crypto');

function logAction(user, action) {
  const entry = { id: randomUUID(), user: user.username, action, at: nowISO() };
  store.auditLogs.push(entry);
  return entry;
}

function restart(req, res) {
  const service = req.params.service;
  const entry = logAction(req.user, `restart ${service}`);
  res.json({ ok: true, service, audit: entry.id });
}

function rollbackLatest(req, res) {
  const entry = logAction(req.user, 'rollback latest');
  res.json({ ok: true, snapshot: 'latest', audit: entry.id });
}

function rollbackTo(req, res) {
  const id = req.params.id;
  const entry = logAction(req.user, `rollback ${id}`);
  res.json({ ok: true, snapshot: id, audit: entry.id });
}

function purgeContradictions(req, res) {
  const entry = logAction(req.user, 'purge contradictions');
  store.contradictions.issues = 0;
  res.json({ ok: true, audit: entry.id });
}

function injectContradictionTest(req, res) {
  const entry = logAction(req.user, 'contradiction test');
  store.contradictions.issues += 1;
  res.json({ ok: true, audit: entry.id });
}

module.exports = {
  restart,
  rollbackLatest,
  rollbackTo,
  purgeContradictions,
  injectContradictionTest,
  logAction,
};
