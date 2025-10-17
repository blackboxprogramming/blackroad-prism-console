import { NextResponse } from "next/server";
import { getRiskSnapshot } from "@/lib/ops/risk";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const snapshot = getRiskSnapshot();
    return NextResponse.json({ systems: snapshot.systems, generatedAt: snapshot.generatedAt });
  } catch (err: any) {
    return NextResponse.json(
      { error: "server_error", details: String(err?.message || err) },
      { status: 500 }
    );
  }
}
