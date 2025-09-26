import { get, set } from 'idb-keyval';

export interface Manifest {
  name: string;
  version: string;
  capabilities: string[];
}

interface Agent {
  name: string;
  manifest: Manifest;
  instance: WebAssembly.Instance;
  memory: WebAssembly.Memory;
  inbox: string[];
  outbox: string[];
  log: string;
}

export class PrismKernel {
  private fs: Record<string, string> = {};
  private agents: Map<string, Agent> = new Map();

  async init() {
    const stored = await get<Record<string, string>>('fs');
    if (stored) {
      this.fs = stored;
      // respawn agents from manifest entries
      for (const path of Object.keys(this.fs)) {
        if (path.startsWith('/prism/agents/') && this.fs[path]) {
          const manifest = JSON.parse(this.fs[path]) as Manifest;
          await this.spawn(manifest.name);
        }
      }
    } else {
      // initialize base directories
      this.fs['/prism/agents/'] = '';
      this.fs['/prism/logs/'] = '';
      this.fs['/prism/contradictions/'] = '';
      await this.persist();
    }
  }

  listAgents() {
    return Array.from(this.agents.keys());
  }

  async spawn(name: string) {
    if (this.agents.has(name)) return;
    const manifest: Manifest = { name, version: '0.1', capabilities: ['ipc'] };
    // For now only built-in echo agent
    const wasm = await WebAssembly.instantiate(await this.getEchoWasm());
    const memory = (wasm.instance.exports.memory as WebAssembly.Memory);
    const agent: Agent = {
      name,
      manifest,
      instance: wasm.instance,
      memory,
      inbox: [],
      outbox: [],
      log: ''
    };
    this.agents.set(name, agent);
    this.fs[`/prism/agents/${name}`] = JSON.stringify(manifest);
    this.fs[`/prism/logs/${name}`] = '';
    await this.persist();
  }

  send(name: string, msg: string) {
    const agent = this.agents.get(name);
    if (!agent) throw new Error('agent not found');
    agent.inbox.push(msg);
    this.process(agent);
  }

  recv(name: string): string | null {
    const agent = this.agents.get(name);
    if (!agent) throw new Error('agent not found');
    return agent.outbox.shift() ?? null;
  }

  ls(path: string): string[] {
    const normalized = path.endsWith('/') ? path : path + '/';
    const entries = new Set<string>();
    for (const p of Object.keys(this.fs)) {
      if (p.startsWith(normalized)) {
        const rest = p.slice(normalized.length);
        if (rest === '') continue;
        const next = rest.split('/')[0];
        entries.add(next + (rest.includes('/') ? '/' : ''));
      }
    }
    return Array.from(entries).sort();
  }

  cat(path: string): string | null {
    return this.fs[path] ?? null;
  }

  private async process(agent: Agent) {
    while (agent.inbox.length) {
      const msg = agent.inbox.shift()!;
      const encoder = new TextEncoder();
      const view = new Uint8Array(agent.memory.buffer);
      const data = encoder.encode(msg);
      view.set(data, 0);
      const handle = agent.instance.exports.handle as Function;
      const ptr = handle(0, data.length) as number;
      const out = new TextDecoder().decode(view.slice(ptr, ptr + data.length));
      agent.outbox.push(out);
      agent.log += out + '\n';
      this.fs[`/prism/logs/${agent.name}`] = agent.log;
      await this.persist();
    }
  }

  private async persist() {
    await set('fs', this.fs);
  }

  private async getEchoWasm(): Promise<ArrayBuffer> {
    const base64 = ECHO_WASM_BASE64;
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

// Minimal echo wasm compiled from WAT
const ECHO_WASM_BASE64 =
  'AGFzbQEAAAABBwFgAn9/AX8DAgEABQMBAAEHEwIGbWVtb3J5AgAGaGFuZGxlAAAKBgEEACAACw==' ;
