import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import { readFile as readKnowledgeFile, searchFiles } from "@/lib/tools/files";

type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

type ToolHandler = (args: unknown) => Promise<Record<string, Json>> | Record<string, Json>;

type ChannelAlias = {
  service: "slack" | "discord";
  secret: string;
  description: string;
};

type PiAlias = {
  host: string;
  description: string;
  allowedCommands: string[];
};

type ServiceAlias = {
  service: string;
  description: string;
};

const TOOL_LOG = path.join(process.cwd(), "logs", "tools", "tool-calls.log");
const SCRATCH_DIR = path.join(process.cwd(), "data", "scratch");
const MEMORY_FILE = path.join(process.cwd(), "data", "memory", "wrapper-memory.json");
const REPO_ROOT = process.cwd();

const channelAliases: Record<string, ChannelAlias> = {
  dev_prs: {
    service: "slack",
    secret: "SLACK_WEBHOOK_URL",
    description: "Engineering PR notifications (Slack webhook)",
  },
  dev_ci: {
    service: "slack",
    secret: "SLACK_WEBHOOK_URL",
    description: "CI signal routing (Slack webhook)",
  },
  releases: {
    service: "slack",
    secret: "SLACK_WEBHOOK_URL",
    description: "Release coordination updates",
  },
  security: {
    service: "slack",
    secret: "SLACK_WEBHOOK_URL",
    description: "Security response updates",
  },
};

const piAliases: Record<string, PiAlias> = {
  pi_core: {
    host: "pi-core.local",
    description: "Primary Raspberry Pi supervisor (read-only)",
    allowedCommands: ["systemctl status core-service --no-pager"],
  },
};

const serviceAliases: Record<string, ServiceAlias> = {
  asana_ops: {
    service: "asana",
    description: "Operations board (Asana project)",
  },
  gitlab_mirror: {
    service: "gitlab",
    description: "GitLab mirror target",
  },
};

type SecretToken = {
  name: string;
  issuedAt: number;
};

type ActiveTarget = {
  secret: string;
  token: string;
  injectedAt: string;
};

type MemoryEntry = {
  key: string;
  value: Json;
  tags?: string[];
  timestamp: string;
};

const secretTokens = new Map<string, SecretToken>();
const activeTargets = new Map<string, ActiveTarget>();
let memoryCache: MemoryEntry[] | null = null;

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

async function ensureDirFor(filePath: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function appendLog(entry: Record<string, Json>) {
  try {
    await ensureDirFor(TOOL_LOG);
    const payload = {
      timestamp: new Date().toISOString(),
      ...entry,
    };
    await fs.appendFile(TOOL_LOG, `${JSON.stringify(payload)}\n`, "utf8");
  } catch {
    // logging failures should not break tool behaviour
  }
}

function safeResolve(relPath: string, base = REPO_ROOT) {
  const resolved = path.resolve(base, relPath);
  if (!resolved.startsWith(base + path.sep) && resolved !== base) {
    throw new Error("path escapes allowed workspace");
  }
  return resolved;
}

async function loadMemory(): Promise<MemoryEntry[]> {
  if (memoryCache) return memoryCache;
  try {
    const raw = await fs.readFile(MEMORY_FILE, "utf8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      memoryCache = parsed as MemoryEntry[];
      return memoryCache;
    }
  } catch {
    // ignore missing or malformed memory store
  }
  memoryCache = [];
  return memoryCache;
}

async function saveMemory(entries: MemoryEntry[]) {
  memoryCache = entries;
  await ensureDirFor(MEMORY_FILE);
  await fs.writeFile(MEMORY_FILE, JSON.stringify(entries, null, 2), "utf8");
}

function resolveTarget(target: string) {
  if (target.startsWith("channel_alias:")) {
    const alias = target.slice("channel_alias:".length);
    const info = channelAliases[alias];
    if (!info) {
      return { ok: false as const, error: `unknown channel alias: ${alias}` };
    }
    return {
      ok: true as const,
      alias,
      secret: info.secret,
      service: info.service,
      description: info.description,
    };
  }
  if (target.startsWith("service_alias:")) {
    const alias = target.slice("service_alias:".length);
    const info = serviceAliases[alias];
    if (!info) {
      return { ok: false as const, error: `unknown service alias: ${alias}` };
    }
    return {
      ok: true as const,
      alias,
      secret: undefined,
      service: info.service,
      description: info.description,
    };
  }
  return {
    ok: true as const,
    alias: target,
    secret: target.startsWith("env:") ? target.slice(4) : undefined,
    service: "custom",
    description: "direct target",
  };
}

async function handleFilesSearch(args: unknown) {
  const rec = asRecord(args);
  const query = typeof rec.query === "string" ? rec.query : "";
  const limit = typeof rec.limit === "number" && rec.limit > 0 ? Math.min(rec.limit, 12) : 4;
  await appendLog({ tool: "files.search", query, limit });
  return { ok: true, hits: searchFiles(query, limit) };
}

async function handleFilesRead(args: unknown) {
  const rec = asRecord(args);
  const relPath = typeof rec.path === "string" ? rec.path : "";
  if (!relPath) return { ok: false, error: "path required" };
  const text = readKnowledgeFile(relPath);
  await appendLog({ tool: "files.read", path: relPath, found: text != null });
  return text != null ? { ok: true, path: relPath, text } : { ok: false, error: "file not found" };
}

async function handleAskCloud(args: unknown) {
  const rec = asRecord(args);
  const question = typeof rec.question === "string" ? rec.question : "";
  const context = typeof rec.context === "string" ? rec.context : undefined;
  const id = typeof rec.id === "string" ? rec.id : undefined;
  await appendLog({ tool: "ask_cloud", question, context: context ?? null, id: id ?? null });
  return {
    ok: true,
    provider: "ask_cloud",
    id: id ?? randomUUID(),
    summary: question ? `Stubbed response for question: ${question}` : "No question supplied",
    context: context ?? null,
    note: "Cloud connector stub executed locally; no external API call made.",
  };
}

async function handlePingPi(args: unknown) {
  const rec = asRecord(args);
  const hostAlias = typeof rec.hostAlias === "string" ? rec.hostAlias : "";
  const command = typeof rec.command === "string" ? rec.command : "";
  const cmdArgs = Array.isArray(rec.args) ? rec.args.map((v) => String(v)) : [];
  const hostInfo = piAliases[hostAlias];
  if (!hostInfo) {
    return { ok: false, error: `unknown pi alias: ${hostAlias}` };
  }
  await appendLog({
    tool: "ping_pi",
    hostAlias,
    command,
    args: cmdArgs,
  });
  const allowed = hostInfo.allowedCommands.includes([command, ...cmdArgs].join(" "));
  return {
    ok: true,
    hostAlias,
    host: hostInfo.host,
    command,
    args: cmdArgs,
    note: allowed ? "Command accepted (stubbed execution)." : "Command outside allow-list; dry-run only.",
    output: allowed ? "core-service active (stub output)" : "no execution performed",
  };
}

async function handleGetSecret(args: unknown) {
  const rec = asRecord(args);
  const name = typeof rec.name === "string" ? rec.name : typeof rec.secret === "string" ? rec.secret : "";
  if (!name) return { ok: false, error: "secret name required" };
  const present = Boolean(process.env[name] && String(process.env[name]).length > 0);
  const token = present ? randomUUID() : null;
  if (token) secretTokens.set(token, { name, issuedAt: Date.now() });
  await appendLog({ tool: "get_secret", name, available: present });
  return {
    ok: present,
    name,
    available: present,
    token,
    masked: present ? "***" : null,
    note: present ? "Secret token issued." : "Secret not configured in environment.",
  };
}

async function handleUseSecret(args: unknown) {
  const rec = asRecord(args);
  const token = typeof rec.token === "string" ? rec.token : "";
  const target = typeof rec.target === "string" ? rec.target : "";
  if (!token || !target) return { ok: false, error: "token and target required" };
  const secret = secretTokens.get(token);
  if (!secret) return { ok: false, error: "unknown secret token" };
  const resolved = resolveTarget(target);
  if (!resolved.ok) return { ok: false, error: resolved.error };
  if (resolved.secret && resolved.secret !== secret.name) {
    return { ok: false, error: `secret ${secret.name} cannot be applied to ${target}` };
  }
  activeTargets.set(target, {
    secret: secret.name,
    token,
    injectedAt: new Date().toISOString(),
  });
  await appendLog({
    tool: "use_secret",
    target,
    secret: secret.name,
  });
  return {
    ok: true,
    target,
    secret: secret.name,
    service: resolved.service,
    description: resolved.description,
  };
}

async function handleHttpRequest(args: unknown) {
  const rec = asRecord(args);
  const target = typeof rec.target === "string" ? rec.target : "";
  const methodRaw = typeof rec.method === "string" ? rec.method : "POST";
  const method = methodRaw.toUpperCase();
  const payload = rec.payload as Json | undefined;
  if (!target) return { ok: false, error: "target required" };
  const resolved = resolveTarget(target);
  if (!resolved.ok) return { ok: false, error: resolved.error };
  const applied = activeTargets.get(target);
  const secretSatisfied = !resolved.secret || (applied && applied.secret === resolved.secret);
  await appendLog({
    tool: "http_request",
    target,
    method,
    payload: payload ?? null,
    secretSatisfied,
  });
  if (!secretSatisfied) {
    return { ok: false, error: `secret not applied for ${target}` };
  }
  return {
    ok: true,
    target,
    method,
    payloadEcho: payload ?? null,
    note: "HTTP request stub executed locally; payload captured in logs.",
  };
}

async function handleRepoDispatch(args: unknown) {
  const rec = asRecord(args);
  const eventType = typeof rec.eventType === "string" ? rec.eventType : "";
  const payload = rec.payload as Json | undefined;
  if (!eventType) return { ok: false, error: "eventType required" };
  await appendLog({ tool: "repo_dispatch", eventType, payload: payload ?? null });
  return {
    ok: true,
    eventType,
    accepted: true,
    note: "Repo dispatch stub accepted.",
  };
}

async function handleGitOps(args: unknown) {
  const rec = asRecord(args);
  const action = typeof rec.action === "string" ? rec.action : "";
  const params = asRecord(rec.params);
  await appendLog({ tool: "git_ops", action, params });
  if (action === "git_mirror") {
    const target = typeof params.target === "string" ? params.target : null;
    return {
      ok: true,
      action,
      target,
      status: "mirror stub complete",
    };
  }
  return { ok: false, error: `unsupported git_ops action: ${action}` };
}

async function handleFileRead(args: unknown) {
  const rec = asRecord(args);
  const relPath = typeof rec.path === "string" ? rec.path : "";
  if (!relPath) return { ok: false, error: "path required" };
  try {
    const resolved = safeResolve(relPath);
    const text = await fs.readFile(resolved, "utf8");
    await appendLog({ tool: "file_read", path: relPath, bytes: text.length });
    return { ok: true, path: relPath, text };
  } catch (error: any) {
    await appendLog({ tool: "file_read", path: relPath, error: String(error?.message || error) });
    return { ok: false, error: String(error?.message || error) };
  }
}

async function handleFileWrite(args: unknown) {
  const rec = asRecord(args);
  const relPath = typeof rec.path === "string" ? rec.path : "";
  const content = typeof rec.content === "string" ? rec.content : "";
  const append = Boolean(rec.append);
  if (!relPath) return { ok: false, error: "path required" };
  const resolved = safeResolve(relPath, SCRATCH_DIR);
  await ensureDirFor(resolved);
  await appendLog({ tool: "file_write", path: relPath, bytes: content.length, append });
  if (append) {
    await fs.appendFile(resolved, content, "utf8");
  } else {
    await fs.writeFile(resolved, content, "utf8");
  }
  return { ok: true, path: relPath, bytes: content.length, append };
}

async function handleMemoryRemember(args: unknown) {
  const rec = asRecord(args);
  const key = typeof rec.key === "string" ? rec.key : "";
  if (!key) return { ok: false, error: "key required" };
  const value = ("value" in rec ? (rec.value as Json) : null) ?? null;
  const tags = Array.isArray(rec.tags) ? rec.tags.map((t) => String(t)) : undefined;
  const entry: MemoryEntry = { key, value, tags, timestamp: new Date().toISOString() };
  const entries = await loadMemory();
  entries.push(entry);
  await saveMemory(entries);
  await appendLog({ tool: "memory_remember", key, tags: tags ?? null });
  return { ok: true, entry };
}

async function handleMemoryRecall(args: unknown) {
  const rec = asRecord(args);
  const key = typeof rec.key === "string" ? rec.key : "";
  const limit = typeof rec.limit === "number" && rec.limit > 0 ? Math.min(rec.limit, 50) : 10;
  const entries = await loadMemory();
  const filtered = key ? entries.filter((e) => e.key === key) : entries;
  const slice = filtered.slice(-limit);
  await appendLog({ tool: "memory_recall", key: key || null, count: slice.length });
  return { ok: true, entries: slice };
}

async function handleSlackSend(args: unknown) {
  const rec = asRecord(args);
  const channelAlias = typeof rec.channel_alias === "string" ? rec.channel_alias : typeof rec.channelAlias === "string" ? rec.channelAlias : "";
  const payload = rec.payload as Json | undefined;
  const target = `channel_alias:${channelAlias}`;
  if (!channelAlias) return { ok: false, error: "channel_alias required" };
  const resolved = resolveTarget(target);
  if (!resolved.ok) return { ok: false, error: resolved.error };
  const applied = activeTargets.get(target);
  const secretSatisfied = applied && applied.secret === resolved.secret;
  await appendLog({ tool: "slack.send", channelAlias, payload: payload ?? null, secretSatisfied: Boolean(secretSatisfied) });
  if (!secretSatisfied) {
    return { ok: false, error: `secret not applied for channel_alias:${channelAlias}` };
  }
  return {
    ok: true,
    channelAlias,
    service: resolved.service,
    payloadEcho: payload ?? null,
    note: "Slack connector stub captured payload locally.",
  };
}

async function handleAsanaCreateTask(args: unknown) {
  const rec = asRecord(args);
  const projectAlias = typeof rec.project_alias === "string" ? rec.project_alias : typeof rec.projectAlias === "string" ? rec.projectAlias : "";
  const title = typeof rec.title === "string" ? rec.title : "";
  const notes = typeof rec.notes === "string" ? rec.notes : "";
  if (!projectAlias) return { ok: false, error: "project_alias required" };
  await appendLog({ tool: "asana.create_task", projectAlias, title, notes });
  return {
    ok: true,
    projectAlias,
    task: {
      id: randomUUID(),
      title,
      notes,
    },
    note: "Asana connector stub recorded task creation.",
  };
}

async function handleGitlabMirror(args: unknown) {
  const rec = asRecord(args);
  const targetAlias = typeof rec.target_alias === "string" ? rec.target_alias : typeof rec.targetAlias === "string" ? rec.targetAlias : "";
  const target = typeof rec.target === "string" ? rec.target : undefined;
  await appendLog({ tool: "gitlab.mirror", targetAlias, target: target ?? null });
  return {
    ok: true,
    targetAlias: targetAlias || null,
    target: target ?? null,
    note: "GitLab mirror stub acknowledged request.",
  };
}

async function handleAirtableUpsert(args: unknown) {
  const rec = asRecord(args);
  const baseAlias = typeof rec.base_alias === "string" ? rec.base_alias : typeof rec.baseAlias === "string" ? rec.baseAlias : "";
  const tableAlias = typeof rec.table_alias === "string" ? rec.table_alias : typeof rec.tableAlias === "string" ? rec.tableAlias : "";
  const record = rec.record as Json | undefined;
  if (!baseAlias || !tableAlias) return { ok: false, error: "base_alias and table_alias required" };
  await appendLog({ tool: "airtable.upsert", baseAlias, tableAlias, record: record ?? null });
  return {
    ok: true,
    baseAlias,
    tableAlias,
    recordEcho: record ?? null,
    note: "Airtable connector stub processed payload.",
  };
}

async function handleDiscordSend(args: unknown) {
  const rec = asRecord(args);
  const channelAlias = typeof rec.channel_alias === "string" ? rec.channel_alias : typeof rec.channelAlias === "string" ? rec.channelAlias : "";
  const payload = rec.payload as Json | undefined;
  if (!channelAlias) return { ok: false, error: "channel_alias required" };
  await appendLog({ tool: "discord.send", channelAlias, payload: payload ?? null });
  return {
    ok: true,
    channelAlias,
    payloadEcho: payload ?? null,
    note: "Discord connector stub recorded payload.",
  };
}

const handlers: Record<string, ToolHandler> = {
  "files.search": handleFilesSearch,
  "files.read": handleFilesRead,
  ask_cloud: handleAskCloud,
  ping_pi: handlePingPi,
  get_secret: handleGetSecret,
  use_secret: handleUseSecret,
  http_request: handleHttpRequest,
  repo_dispatch: handleRepoDispatch,
  git_ops: handleGitOps,
  file_read: handleFileRead,
  file_write: handleFileWrite,
  memory_remember: handleMemoryRemember,
  memory_recall: handleMemoryRecall,
  "slack.send": handleSlackSend,
  "asana.create_task": handleAsanaCreateTask,
  "gitlab.mirror": handleGitlabMirror,
  "airtable.upsert": handleAirtableUpsert,
  "discord.send": handleDiscordSend,
};

export async function dispatchTool(name: string, args: unknown) {
  const handler = handlers[name];
  if (!handler) {
    await appendLog({ tool: name, error: "unknown tool" });
    return { ok: false, error: `unknown tool: ${name}` };
  }
  try {
    return await handler(args);
  } catch (error: any) {
    await appendLog({ tool: name, error: String(error?.message || error) });
    return { ok: false, error: String(error?.message || error) };
  }
}

export const aliasMap = {
  channelAliases,
  piAliases,
  serviceAliases,
};

