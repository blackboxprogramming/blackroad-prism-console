import dashboardMock from "../mocks/dashboard.json";
import agentsMock from "../mocks/agents.json";
import type { AgentRecord, DashboardOverview } from "@/types/dashboard";
import { config } from "./config";

async function fetchJson<T>(path: string): Promise<T> {
  if (!config.apiUrl) {
    return fallbackForPath<T>(path);
  }

  const url = new URL(path, config.apiUrl);
  const headers = new Headers({ "Content-Type": "application/json" });
  if (config.apiToken) {
    headers.set("Authorization", `Bearer ${config.apiToken}`);
  }

  try {
    const res = await fetch(url.toString(), { headers, cache: "no-store" });
    if (!res.ok) {
      throw new Error(`Request failed with status ${res.status}`);
    }
    return (await res.json()) as T;
  } catch (error) {
    console.warn(`Falling back to mock for ${path}:`, error);
    return fallbackForPath<T>(path);
  }
}

function fallbackForPath<T>(path: string): T {
  if (path.includes("/api/mobile/dashboard")) {
    return dashboardMock as T;
  }
  if (path.includes("/api/agents")) {
    return agentsMock as T;
  }
  throw new Error(`No mock available for path ${path}`);
}

export async function getDashboard(): Promise<DashboardOverview> {
  return fetchJson<DashboardOverview>("/api/mobile/dashboard");
}

export async function getAgents(): Promise<AgentRecord[]> {
  return fetchJson<AgentRecord[]>("/api/agents");
}
