const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

const CONFIG_PATH =
  process.env.PROVIDERS_CONFIG ||
  path.join(__dirname, '../../config/providers.yaml');

let cache;

function loadConfig() {
  if (!cache) {
    const file = fs.readFileSync(CONFIG_PATH, 'utf8');
    const data = yaml.parse(file);
    cache = data.providers || {};
  }
  return cache;
}

function listProviders() {
  const cfg = loadConfig();
  return Object.entries(cfg).map(([id, info]) => ({
    id,
    display_name: info.display_name,
    status: process.env[info.env_key] ? 'ready' : 'missing_key',
  }));
}

function providerHealth(name) {
  const cfg = loadConfig();
  const info = cfg[name];
  if (!info) return null;
  return {
    id: name,
    ok: Boolean(process.env[info.env_key]),
  };
}

module.exports = { listProviders, providerHealth };
