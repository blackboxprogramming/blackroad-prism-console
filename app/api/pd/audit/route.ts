import { NextRequest, NextResponse } from "next/server";
import { getRecentIncidentEvents } from "@/lib/ops/db";
import { requireOpsAccess } from "@/lib/ops/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    requireOpsAccess(req);
    const events = getRecentIncidentEvents(10);
    return NextResponse.json({ events });
  } catch (err: any) {
    if (String(err?.message || err) === "forbidden") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    return NextResponse.json(
      { error: "server_error", details: String(err?.message || err) },
      { status: 500 }
    );
  }
}
