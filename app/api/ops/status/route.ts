import { NextResponse } from "next/server";

export const runtime = "nodejs";

const DEFAULT_STATUS_BASE = process.env.BR_API_GATEWAY_URL ?? process.env.OPS_STATUS_BASE;
const STATUS_ENDPOINT =
  process.env.OPS_STATUS_ENDPOINT ?? (DEFAULT_STATUS_BASE ? `${DEFAULT_STATUS_BASE.replace(/\/$/, "")}/v1/status` : undefined);
const VERSION_ENDPOINT =
  process.env.OPS_VERSION_ENDPOINT ?? (DEFAULT_STATUS_BASE ? `${DEFAULT_STATUS_BASE.replace(/\/$/, "")}/v1/version` : undefined);
const UI_HEALTH_ENDPOINT =
  process.env.OPS_UI_HEALTH_URL ?? process.env.APP_HEALTH_URL ?? "https://app.blackroad.io/healthz/ui";

interface UpstreamStatus {
  version?: string;
  tag?: string;
  version_tag?: string;
  canary_percent?: number | string;
  by?: string;
  deployed_by?: string;
  ui_ok?: boolean;
  fivexx?: number | string;
  p95?: number | string;
  burn_rate_fast?: number | string;
  burn_rate_slow?: number | string;
  environment?: string;
  updated_at?: string;
  permissions?: {
    canOperate?: boolean;
    readOnly?: boolean;
    reason?: string;
  };
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return fallback;
}

async function fetchJson(url: string | undefined): Promise<UpstreamStatus | undefined> {
  if (!url) return undefined;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, { cache: "no-store", signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) {
      return undefined;
    }
    return (await res.json()) as UpstreamStatus;
  } catch (error) {
    console.warn(`[ops] unable to fetch ${url}:`, error);
    return undefined;
  }
}

async function probeHealth(url: string | undefined): Promise<boolean> {
  if (!url) return false;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, { cache: "no-store", signal: controller.signal });
    clearTimeout(timeout);
    return res.ok;
  } catch (error) {
    console.warn(`[ops] health probe failed for ${url}:`, error);
    return false;
  }
}

export async function GET() {
  const [statusDoc, versionDoc] = await Promise.all([fetchJson(STATUS_ENDPOINT), fetchJson(VERSION_ENDPOINT)]);

  const versionFromStatus = statusDoc?.version ?? statusDoc?.tag ?? statusDoc?.version_tag;
  const version =
    versionFromStatus ?? versionDoc?.version ?? process.env.RELEASE_TAG ?? process.env.NEXT_PUBLIC_RELEASE ?? "dev";

  const canaryPercent =
    statusDoc?.canary_percent ?? versionDoc?.canary_percent ?? process.env.CANARY_PCT ?? process.env.NEXT_PUBLIC_CANARY_PCT;

  const uiOk =
    typeof statusDoc?.ui_ok === "boolean" ? statusDoc.ui_ok : await probeHealth(statusDoc ? undefined : UI_HEALTH_ENDPOINT);

  const permissionsSource = statusDoc?.permissions;
  const isReadOnlyEnv = String(process.env.OPS_READ_ONLY ?? "").toLowerCase() === "true";
  const canOperate = permissionsSource?.canOperate ?? !permissionsSource?.readOnly ?? !isReadOnlyEnv;

  const payload = {
    version,
    version_tag: versionDoc?.version ?? statusDoc?.version_tag,
    canary_percent: toNumber(canaryPercent, Number(process.env.CANARY_PCT ?? 0)),
    by: statusDoc?.by ?? statusDoc?.deployed_by ?? process.env.LAST_DEPLOYER ?? "unknown",
    ui_ok: uiOk,
    fivexx: toNumber(statusDoc?.fivexx, 0),
    p95: toNumber(statusDoc?.p95, 0),
    burn_rate_fast: toNumber(statusDoc?.burn_rate_fast, 0),
    burn_rate_slow: toNumber(statusDoc?.burn_rate_slow, 0),
    environment: statusDoc?.environment ?? process.env.OPERATIONS_ENVIRONMENT ?? process.env.NODE_ENV ?? "production",
    updated_at: statusDoc?.updated_at ?? new Date().toISOString(),
    permissions: {
      canOperate,
      reason: permissionsSource?.reason ?? (canOperate ? undefined : "Read only mode enabled")
    }
  };

  return NextResponse.json(payload);
}
