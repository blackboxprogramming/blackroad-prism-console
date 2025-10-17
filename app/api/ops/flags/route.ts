import { NextResponse } from "next/server";

export const runtime = "nodejs";

const FLAGS_ENDPOINT =
  process.env.OPS_FLAGS_ENDPOINT ?? process.env.FLAGS_ENDPOINT ?? process.env.BR_FLAGS_URL ?? undefined;

interface FlagsDocument {
  version?: string;
  features?: Record<string, unknown>;
}

async function fetchFlags(url: string | undefined): Promise<FlagsDocument | undefined> {
  if (!url) return undefined;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, { cache: "no-store", signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) {
      return undefined;
    }
    return (await res.json()) as FlagsDocument;
  } catch (error) {
    console.warn(`[ops] unable to fetch flags from ${url}:`, error);
    return undefined;
  }
}

export async function GET() {
  const doc = await fetchFlags(FLAGS_ENDPOINT);
  const payload: FlagsDocument = {
    version: doc?.version ?? process.env.FLAGS_VERSION ?? "unknown",
    features: doc?.features ?? {}
  };
  return NextResponse.json(payload);
}
