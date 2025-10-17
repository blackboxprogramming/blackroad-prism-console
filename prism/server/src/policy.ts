import fs from 'fs';
import path from 'path';
import YAML from 'yaml';
import { FastifyInstance } from 'fastify';
import { z } from 'zod';

export type Capability = 'write' | 'exec' | 'net' | 'secrets' | 'dns' | 'deploy' | 'read';
export type Mode = 'playground' | 'dev' | 'trusted' | 'prod';

type Decision = 'auto' | 'review' | 'forbid';

const presets: Record<Mode, Record<Capability, Decision>> = {
  playground: { write: 'forbid', exec: 'auto', net: 'review', secrets: 'review', dns: 'forbid', deploy: 'forbid', read: 'auto' },
  dev:        { write: 'review', exec: 'auto', net: 'review', secrets: 'review', dns: 'review', deploy: 'review', read: 'auto' },
  trusted:    { write: 'auto',   exec: 'auto', net: 'review', secrets: 'review', dns: 'review', deploy: 'review', read: 'auto' },
  prod:       { write: 'review', exec: 'review', net: 'review', secrets: 'review', dns: 'review', deploy: 'review', read: 'auto' }
};

const configPath = path.join(process.cwd(), 'prism.config.yaml');

interface PolicyConfig {
  mode?: Mode;
  overrides?: Partial<Record<Capability, Decision>>;
}

function loadConfig(): PolicyConfig {
  if (fs.existsSync(configPath)) {
    return YAML.parse(fs.readFileSync(configPath, 'utf8')) as PolicyConfig;
  }
  return {};
}

function saveConfig(cfg: PolicyConfig) {
  fs.writeFileSync(configPath, YAML.stringify(cfg));
}

let currentMode: Mode = loadConfig().mode || 'dev';
let overrides: Partial<Record<Capability, Decision>> = loadConfig().overrides || {};

export function checkCapability(cap: Capability): Decision {
  const preset = presets[currentMode][cap];
  return overrides[cap] || preset;
}

export default async function policyRoutes(app: FastifyInstance) {
  app.get('/mode', async (_req, reply) => {
    reply.send({ currentMode });
  });
  app.put('/mode', async (req, reply) => {
    const body = z.object({ mode: z.enum(['playground','dev','trusted','prod']) }).parse(req.body);
    currentMode = body.mode;
    saveConfig({ mode: currentMode, overrides });
    reply.send({ currentMode });
  });
}

export function setMode(mode: Mode) {
  currentMode = mode;
  saveConfig({ mode: currentMode, overrides });
}

export function getMode(): Mode {
  return currentMode;
}
