import fs from "fs";
import path from "path";
import { getOpenIncidentForSystem } from "./db";

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
}

export interface RiskSnapshot {
  generatedAt: string;
  systems: RiskSystem[];
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

export function getRiskSnapshot(): RiskSnapshot {
  const snapshot = readSnapshotFile();
  const augmented = snapshot.systems.map((system) => {
    const open = getOpenIncidentForSystem(system.key);
    return {
      ...system,
      pdIncidentId: open?.pdIncidentId ?? null,
      pdUrl: open?.url ?? null,
      openedAt: open?.createdAt ?? null,
    };
  });
  return { ...snapshot, systems: augmented };
}
