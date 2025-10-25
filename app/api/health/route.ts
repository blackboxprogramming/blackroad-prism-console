import { NextResponse } from "next/server";

const bootStartedAt = Date.now();

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function coerceVersion(): string {
  const candidates = [
    process.env.APP_VERSION,
    process.env.NEXT_PUBLIC_APP_VERSION,
    process.env.RELEASE_TAG,
    process.env.VERCEL_GIT_COMMIT_SHA,
    process.env.npm_package_version
  ];

  for (const candidate of candidates) {
    if (candidate && candidate.trim().length > 0) {
      return candidate;
    }
  }

  return "0.0.0";
}

function coerceInteger(value: string | undefined, fallback = 0): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function resolveModelsLoaded(): number {
  const sources = [process.env.MODELS_LOADED, process.env.NEXT_PUBLIC_MODELS_LOADED];
  for (const source of sources) {
    const parsed = coerceInteger(source);
    if (parsed > 0) {
      return parsed;
    }
  }
  return 0;
}

function resolveRevision(): string | undefined {
  const candidates = [
    process.env.GIT_SHA,
    process.env.VERCEL_GIT_COMMIT_SHA,
    process.env.SOURCE_VERSION,
    process.env.DEPLOY_COMMIT
  ];

  for (const candidate of candidates) {
    if (candidate && candidate.trim().length > 0) {
      return candidate;
    }
  }

  return undefined;
}

export async function GET() {
  const uptimeSeconds = Math.round((Date.now() - bootStartedAt) / 1000);
  const version = coerceVersion();
  const revision = resolveRevision();
  const environment = process.env.APP_ENV ?? process.env.NODE_ENV ?? "production";

  const payload: Record<string, unknown> = {
    status: "ok",
    checked_at: new Date().toISOString(),
    uptime_seconds: uptimeSeconds,
    version,
    environment,
    models_loaded: resolveModelsLoaded()
  };

  if (revision) {
    payload.revision = revision;
  }

  return NextResponse.json(payload, {
    headers: {
      "cache-control": "no-store, max-age=0, must-revalidate"
    }
  });
}
