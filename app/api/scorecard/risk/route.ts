import { NextRequest, NextResponse } from "next/server";
import { getRiskSnapshot } from "@/lib/ops/risk";

export const dynamic = "force-dynamic";

function parseSandboxFlag(value: string | null): boolean {
  if (!value) return false;
  const normalized = value.toLowerCase();
  return ["1", "true", "yes", "y", "sandbox"].includes(normalized);
}

export async function GET(req: NextRequest) {
  try {
    const includeSandbox = parseSandboxFlag(req.nextUrl.searchParams.get("sandbox"));
    const snapshot = getRiskSnapshot({ includeSandbox });
    return NextResponse.json({ systems: snapshot.systems, generatedAt: snapshot.generatedAt });
  } catch (err: any) {
    return NextResponse.json(
      { error: "server_error", details: String(err?.message || err) },
      { status: 500 }
    );
  }
}
