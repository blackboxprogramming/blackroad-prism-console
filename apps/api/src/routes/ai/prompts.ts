import { Router } from 'express';
import fs from 'fs';
import path from 'path';

const r = Router();
const INDEX_PATH = path.join('ai', 'prompts', 'index.json');
const VERSIONS_DIR = path.join('ai', 'prompts', 'versions');
const KEY_PATTERN = /^[a-zA-Z0-9_.-]+$/;
const VERSION_PATTERN = /^[a-zA-Z0-9_.-]+$/;

const ensureIndexDir = () => fs.mkdirSync(path.dirname(INDEX_PATH), { recursive: true });
const loadIndex = () => (fs.existsSync(INDEX_PATH) ? JSON.parse(fs.readFileSync(INDEX_PATH, 'utf-8')) : { prompts: {} });
const writeIndex = (data: any) => {
  ensureIndexDir();
  fs.writeFileSync(INDEX_PATH, JSON.stringify(data, null, 2));
};

const sanitizeKey = (rawKey: unknown) => {
  const key = String(rawKey ?? '');
  if (!key || !KEY_PATTERN.test(key)) {
    return null;
  }
  return key;
};

const sanitizeVersion = (rawVersion: unknown) => {
  const version = String(rawVersion ?? '');
  if (!version || !VERSION_PATTERN.test(version)) {
    return null;
  }
  return version;
};

const buildVersionPath = (key: string, version: string) => path.join(VERSIONS_DIR, `${key}@${version}.md`);

r.post('/prompts/upsert', (req, res) => {
  const { key: rawKey, version: rawVersion, role, content, metadata } = req.body || {};
  const key = sanitizeKey(rawKey);
  if (!key) {
    return res.status(400).json({ error: 'invalid_key' });
  }

  const index = loadIndex();
  index.prompts[key] ||= { latest: null, versions: [] };

  const existingVersions = index.prompts[key].versions || [];
  const nextVersion = `v${(existingVersions.length || 0) + 1}`;
  const version = rawVersion ? sanitizeVersion(rawVersion) : nextVersion;

  if (!version) {
    return res.status(400).json({ error: 'invalid_version' });
  }

  fs.mkdirSync(VERSIONS_DIR, { recursive: true });
  fs.writeFileSync(buildVersionPath(key, version), content || '');

  index.prompts[key].versions = Array.from(new Set([...existingVersions, version]));
  index.prompts[key].latest = version;
  index.prompts[key].role = role || 'system';
  index.prompts[key].metadata = metadata || {};

  writeIndex(index);
  res.json({ ok: true, key, version });
});

r.get('/prompts/:key', (req, res) => {
  const key = sanitizeKey(req.params.key);
  if (!key) {
    return res.status(400).json({ error: 'invalid_key' });
  }

  const prompt = loadIndex().prompts[key];
  if (!prompt) {
    return res.status(404).json({ error: 'not_found' });
  }

  const versions = (prompt.versions || []).map((version: string) => ({
    version,
    path: path.posix.join('ai/prompts/versions', `${key}@${version}.md`),
  }));

  res.json({ key, latest: prompt.latest, role: prompt.role, metadata: prompt.metadata, versions });
});

r.post('/prompts/rollback', (req, res) => {
  const { key: rawKey, version: rawVersion } = req.body || {};
  const key = sanitizeKey(rawKey);
  const version = sanitizeVersion(rawVersion);

  if (!key || !version) {
    return res.status(400).json({ error: 'invalid_key_or_version' });
  }

  const index = loadIndex();
  if (!index.prompts[key] || !(index.prompts[key].versions || []).includes(version)) {
    return res.status(404).json({ error: 'not_found' });
  }

  index.prompts[key].latest = version;
  writeIndex(index);
  res.json({ ok: true });
});

export default r;
