import fs from "fs";
import path from "path";
import { getOpenIncidentForSystem } from "./db";
import { jiraBrowseUrl } from "./jira";
import { shouldUseSandbox } from "./pagerduty";

export interface RiskSystem {
  key: string;
  name: string;
  color: "red" | "yellow" | "green";
  risk: number;
  action: string;
  owner?: string;
  pdIncidentId?: string | null;
  pdUrl?: string | null;
  openedAt?: string | null;
  jiraKey?: string | null;
  jiraUrl?: string | null;
}

export interface RiskSnapshot {
  generatedAt: string;
  systems: RiskSystem[];
}

interface RiskOptions {
  includeSandbox?: boolean;
}

const defaultSnapshotPath = process.env.RISK_SNAPSHOT_PATH
  || path.join(process.cwd(), "data", "ops", "risk-snapshot.json");

function readSnapshotFile(): RiskSnapshot {
  try {
    const raw = fs.readFileSync(defaultSnapshotPath, "utf-8");
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return parsed as RiskSnapshot;
    }
  } catch (err) {
    console.warn("[pd] using fallback risk snapshot", err);
  }

  return {
    generatedAt: new Date().toISOString(),
    systems: [],
  };
}

export function getRiskSnapshot(options: RiskOptions = {}): RiskSnapshot {
  const snapshot = readSnapshotFile();
  const augmented = snapshot.systems.map((system) => {
    const open = getOpenIncidentForSystem(system.key);
    const sandbox = shouldUseSandbox(system.key, false);
    return {
      ...system,
      pdIncidentId: open?.pdIncidentId ?? null,
      pdUrl: open?.url ?? null,
      openedAt: open?.createdAt ?? null,
      jiraKey: open?.jiraKey ?? null,
      jiraUrl: open?.jiraKey ? jiraBrowseUrl(open.jiraKey, sandbox) : null,
    };
  });
  if (options.includeSandbox) {
    const sandboxKey = process.env.SMOKE_SYSTEM_KEY || "sandbox";
    const exists = augmented.some((system) => system.key === sandboxKey);
    if (!exists) {
      const open = getOpenIncidentForSystem(sandboxKey);
      augmented.push({
        key: sandboxKey,
        name: "Sandbox Smoke",
        color: open?.pdIncidentId ? "yellow" : "green",
        risk: open?.pdIncidentId ? 0.5 : 0.1,
        action: "Run PD↔Jira smoke",
        owner: "Ops",
        pdIncidentId: open?.pdIncidentId ?? null,
        pdUrl: open?.url ?? null,
        openedAt: open?.createdAt ?? null,
        jiraKey: open?.jiraKey ?? null,
        jiraUrl: open?.jiraKey ? jiraBrowseUrl(open.jiraKey, true) : null,
      });
    }
  }
  return { ...snapshot, systems: augmented };
}
