import fs from 'node:fs';
import path from 'node:path';

export type AgentManifest = {
  name: string; role: string; version: string;
  capabilities: string[]; triggers: {kind:string; match:string}[];
  tools: string[]; policyHints?: Record<string, any>;
};

export function loadAgents(dir = path.join(process.cwd(), 'configs/agents')) {
  const globs = fs.readdirSync(dir).filter(f => f.endsWith('.yaml'));
  // TODO: parse YAML → AgentManifest
  return globs.map(f => ({file:f, /*manifest*/} as any));
}
