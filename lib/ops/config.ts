import fs from "fs";
import path from "path";

type Urgency = "high" | "low";

export interface SystemPagerDutyConfig {
  serviceId: string;
  escalationPolicyId?: string;
  assignees?: string[];
  urgency?: Urgency;
}

export interface PagerDutyConfig {
  systems: Record<string, SystemPagerDutyConfig>;
  runbooks?: Record<string, string>;
}

let cachedConfig: PagerDutyConfig | null = null;

function readConfigFromEnv(): PagerDutyConfig | null {
  const raw = process.env.PD_SYSTEM_MAP;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === "object" && parsed) {
      const { systems = {}, runbooks = {} } = parsed as PagerDutyConfig;
      return { systems, runbooks };
    }
  } catch (err) {
    console.error("[pd] failed to parse PD_SYSTEM_MAP env", err);
  }
  return null;
}

function readConfigFromFile(): PagerDutyConfig {
  const explicit = process.env.PD_CONFIG_PATH;
  const candidates = [
    explicit,
    path.join(process.cwd(), "config", "pagerduty.json"),
  ].filter((p): p is string => Boolean(p));

  for (const file of candidates) {
    try {
      const raw = fs.readFileSync(file, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        const { systems = {}, runbooks = {} } = parsed as PagerDutyConfig;
        return { systems, runbooks };
      }
    } catch (err) {
      // try next candidate
    }
  }

  return { systems: {}, runbooks: {} };
}

export function loadPagerDutyConfig(): PagerDutyConfig {
  if (!cachedConfig) {
    cachedConfig = readConfigFromEnv() ?? readConfigFromFile();
  }
  return cachedConfig;
}

export function getSystemPagerDutyConfig(systemKey: string): SystemPagerDutyConfig | undefined {
  const cfg = loadPagerDutyConfig();
  return cfg.systems[systemKey] ?? cfg.systems["default"];
}

export function getRunbookUrl(systemKey: string, options: { sandbox?: boolean } = {}): string | undefined {
  if (options.sandbox && process.env.RUNBOOK_URL_SANDBOX) {
    return process.env.RUNBOOK_URL_SANDBOX;
  }
  const cfg = loadPagerDutyConfig();
  const map = cfg.runbooks ?? {};
  return map[systemKey] ?? map["default"] ?? process.env.RUNBOOK_URL;
}

export function getBulkThreshold(): number {
  const raw = process.env.PD_BULK_THRESHOLD;
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  return 3;
}

export function resetPagerDutyConfigCache(): void {
  cachedConfig = null;
}
