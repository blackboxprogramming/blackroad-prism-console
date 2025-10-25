export interface Metric {
  id: string;
  label: string;
  value: string;
  change?: number;
  trend?: "up" | "down" | "flat";
}

export interface LatencySample {
  region: string;
  p95Ms: number;
}

export interface DashboardOverview {
  systemUptime: string;
  activeAgents: number;
  averageLatencyMs: number;
  incidents24h: number;
  metrics: Metric[];
  latency: LatencySample[];
  shortcuts: Array<{
    id: string;
    label: string;
    description: string;
    command: string;
  }>;
}

export interface AgentRecord {
  id: string;
  name: string;
  domain: string;
  status: "online" | "offline" | "degraded";
  memoryUsageMb: number;
  lastHeartbeat: string;
}
