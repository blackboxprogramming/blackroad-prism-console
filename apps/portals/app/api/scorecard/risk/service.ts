import fs from "node:fs";
import path from "node:path";

export type RiskSystem = {
  key: string;
  name: string;
  risk: number;
  burn: number;
  findings: number;
  cost: number;
  color: "red" | "yellow" | "green";
  action: string;
  links: {
    g?: string;
    s?: string;
    c?: string;
  };
};

export type RiskPayload = {
  systems: RiskSystem[];
  updatedAt: string;
  stale: boolean;
};

type ReliabilityMap = Record<string, number>;
type SecurityMap = Record<string, number>;
type CostMap = Record<string, { actual?: number; forecast?: number }>;

type RiskCache = {
  payload: RiskPayload | null;
};

const globalState = globalThis as typeof globalThis & {
  __riskScorecardCache?: RiskCache;
};

function getCache(): RiskCache {
  if (!globalState.__riskScorecardCache) {
    globalState.__riskScorecardCache = { payload: null };
  }
  return globalState.__riskScorecardCache;
}

const SYSTEM_CONFIG: { key: string; name: string; action: string }[] = [
  { key: "api", name: "Public API", action: "Throttle retry storm + ship circuit breaker patch." },
  { key: "ui", name: "Web UI", action: "Prioritize checkout latency fix; rerun lighthouse after deploy." },
  { key: "ingest-gh", name: "Ingest – GitHub", action: "Clear stuck runner + requeue repo sync backlog." },
  { key: "ingest-lin", name: "Ingest – Linear", action: "Re-auth OAuth token; backfill last 48h issues." },
  { key: "ingest-str", name: "Ingest – Stripe", action: "Validate webhook secret rotation + replay missing events." },
  { key: "infra", name: "Core Infra", action: "Drain noisy node pool; finish kernel patch rollout." },
  { key: "data", name: "Data Platform", action: "Refresh dbt freshness tests + unblock nightly pipeline." },
];

const DEFAULT_BURN: ReliabilityMap = {
  api: 1.2,
  ui: 0.6,
  "ingest-gh": 1.4,
  "ingest-lin": 0.5,
  "ingest-str": 0.8,
  infra: 0.4,
  data: 0.7,
};

const LINK_MAP: Record<string, { g?: string; s?: string; c?: string }> = {
  api: {
    g: process.env.GRAFANA_PANEL_API,
    s: process.env.SECHUB_LINK_API,
    c: process.env.COSTEXPLORER_LINK_API,
  },
  ui: {
    g: process.env.GRAFANA_PANEL_UI,
    s: process.env.SECHUB_LINK_UI,
    c: process.env.COSTEXPLORER_LINK_UI,
  },
  "ingest-gh": {
    g: process.env.GRAFANA_PANEL_GH,
    s: process.env.SECHUB_LINK_GH,
    c: process.env.COSTEXPLORER_LINK_GH,
  },
  "ingest-lin": {
    g: process.env.GRAFANA_PANEL_LIN,
    s: process.env.SECHUB_LINK_LIN,
    c: process.env.COSTEXPLORER_LINK_LIN,
  },
  "ingest-str": {
    g: process.env.GRAFANA_PANEL_STR,
    s: process.env.SECHUB_LINK_STR,
    c: process.env.COSTEXPLORER_LINK_STR,
  },
  infra: {
    g: process.env.GRAFANA_PANEL_INFRA,
    s: process.env.SECHUB_LINK_INFRA,
    c: process.env.COSTEXPLORER_LINK_INFRA,
  },
  data: {
    g: process.env.GRAFANA_PANEL_DATA,
    s: process.env.SECHUB_LINK_DATA,
    c: process.env.COSTEXPLORER_LINK_DATA,
  },
};

function clamp(value: number, min: number, max: number) {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function round(value: number, decimals: number) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

async function loadJson(source: string | undefined, fallback: string): Promise<any | null> {
  const target = source && source.trim().length > 0 ? source.trim() : fallback;
  if (!target) return null;

  if (target.startsWith("http://") || target.startsWith("https://")) {
    const response = await fetch(target, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Failed to fetch ${target}: ${response.status}`);
    }
    return response.json();
  }

  const resolved = path.resolve(target);
  if (!fs.existsSync(resolved)) {
    return null;
  }
  const raw = fs.readFileSync(resolved, "utf-8");
  if (!raw.trim()) return null;
  return JSON.parse(raw);
}

function parseReliability(data: any): ReliabilityMap {
  if (!data || typeof data !== "object") return {};
  if (Array.isArray(data)) {
    return data.reduce<ReliabilityMap>((acc, entry) => {
      const key = typeof entry?.key === "string" ? entry.key : entry?.system;
      const burn = Number(entry?.burn ?? entry?.value);
      if (key) acc[key] = burn;
      return acc;
    }, {});
  }
  return Object.entries(data).reduce<ReliabilityMap>((acc, [key, value]) => {
    acc[key] = Number(value);
    return acc;
  }, {});
}

function parseSecurity(data: any): SecurityMap {
  if (!data || typeof data !== "object") return {};
  if (Array.isArray(data)) {
    return data.reduce<SecurityMap>((acc, entry) => {
      const key = typeof entry?.key === "string" ? entry.key : entry?.system;
      const count = Number(entry?.count ?? entry?.value ?? entry?.findings ?? 0);
      if (key) acc[key] = count;
      return acc;
    }, {});
  }
  return Object.entries(data).reduce<SecurityMap>((acc, [key, value]) => {
    acc[key] = Number((value as any)?.count ?? value);
    return acc;
  }, {});
}

function parseCost(data: any): CostMap {
  const result: CostMap = {};
  if (!data || typeof data !== "object") return result;
  if (Array.isArray(data)) {
    for (const entry of data) {
      const key = typeof entry?.key === "string" ? entry.key : entry?.system;
      if (!key) continue;
      const actual = Number(entry?.actual ?? entry?.cost ?? entry?.value ?? 0);
      const forecast = Number(entry?.forecast ?? entry?.plan ?? entry?.target ?? 0);
      result[key] = { actual, forecast };
    }
    return result;
  }
  for (const [key, value] of Object.entries(data)) {
    const val = value as any;
    result[key] = {
      actual: Number(val?.actual ?? val?.cost ?? val?.value ?? 0),
      forecast: Number(val?.forecast ?? val?.plan ?? val?.target ?? val?.budget ?? 0),
    };
  }
  return result;
}

function computeCostDelta(entry: { actual?: number; forecast?: number } | undefined) {
  if (!entry) return 0;
  const actual = Number(entry.actual ?? 0);
  const forecast = Number(entry.forecast ?? 0);
  if (forecast <= 0) {
    return clamp(actual > 0 ? 1 : 0, 0, 1);
  }
  const over = (actual - forecast) / forecast;
  return clamp(over <= 0 ? 0 : over, 0, 1);
}

function computeRiskScore(burn: number, findings: number, cost: number) {
  const score = burn * 0.5 + findings * 0.3 + cost * 0.2;
  return clamp(score, 0, 2);
}

function toColor(score: number): RiskSystem["color"] {
  if (score >= 1.2) return "red";
  if (score >= 0.7) return "yellow";
  return "green";
}

function buildLinks(key: string) {
  const entry = LINK_MAP[key] || {};
  const links: { g?: string; s?: string; c?: string } = {};
  if (entry.g) links.g = entry.g;
  if (entry.s) links.s = entry.s;
  if (entry.c) links.c = entry.c;
  return links;
}

export async function loadRiskScorecard(): Promise<RiskPayload> {
  const cache = getCache();
  const reliabilitySource = process.env.RISK_BURN_FEED_URL ?? process.env.RISK_BURN_SOURCE;
  const securitySource = process.env.SECURITY_FEED_URL ?? process.env.SECURITY_FEED_SOURCE;
  const costSource = process.env.COST_FEED_URL ?? process.env.COST_FEED_SOURCE;

  let reliabilityMap: ReliabilityMap = {};
  let reliabilityFailed = false;

  if (reliabilitySource) {
    try {
      const rawReliability = await loadJson(reliabilitySource, "portal/reports/risk_burn.json");
      if (rawReliability) {
        reliabilityMap = parseReliability(rawReliability);
      }
    } catch (error) {
      reliabilityFailed = true;
      console.error("[risk-scorecard] reliability feed error", error);
    }
  }

  if (!Object.keys(reliabilityMap).length) {
    reliabilityMap = { ...DEFAULT_BURN };
  }

  let securityMap: SecurityMap = {};
  if (securitySource) {
    try {
      const rawSecurity = await loadJson(securitySource, "portal/reports/security_feed.json");
      if (rawSecurity) securityMap = parseSecurity(rawSecurity);
    } catch (error) {
      console.error("[risk-scorecard] security feed error", error);
    }
  } else {
    const fallback = await loadJson(undefined, "portal/reports/security_feed.json");
    if (fallback) securityMap = parseSecurity(fallback);
  }

  let costMap: CostMap = {};
  if (costSource) {
    try {
      const rawCost = await loadJson(costSource, "portal/reports/cost_feed.json");
      if (rawCost) costMap = parseCost(rawCost);
    } catch (error) {
      console.error("[risk-scorecard] cost feed error", error);
    }
  } else {
    const fallback = await loadJson(undefined, "portal/reports/cost_feed.json");
    if (fallback) costMap = parseCost(fallback);
  }

  const now = new Date();
  const systems: RiskSystem[] = SYSTEM_CONFIG.map((config) => {
    const burnRaw = reliabilityMap[config.key] ?? DEFAULT_BURN[config.key] ?? 0;
    const burn = round(clamp(Number(burnRaw) || 0, 0, 2), 2);
    const findingsRaw = securityMap[config.key] ?? 0;
    const findings = round(clamp(Number(findingsRaw) || 0, 0, 2), 2);
    const costDelta = round(computeCostDelta(costMap[config.key]), 2);
    const risk = round(computeRiskScore(burn, findings, costDelta), 2);
    const color = toColor(risk);

    return {
      key: config.key,
      name: config.name,
      burn,
      findings,
      cost: costDelta,
      risk,
      color,
      action: config.action,
      links: buildLinks(config.key),
    };
  }).sort((a, b) => b.risk - a.risk || a.name.localeCompare(b.name));

  const payload: RiskPayload = {
    systems,
    updatedAt: now.toISOString(),
    stale: reliabilityFailed,
  };

  if (reliabilityFailed && cache.payload) {
    return { ...cache.payload, stale: true };
  }

  if (!reliabilityFailed || !cache.payload) {
    cache.payload = payload;
  }

  return payload;
}
