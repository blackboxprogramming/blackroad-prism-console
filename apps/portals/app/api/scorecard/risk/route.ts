import { NextResponse } from "next/server";
import { loadRiskScorecard } from "./service";

export const dynamic = "force-dynamic";

export async function GET() {
  const payload = await loadRiskScorecard();
  return NextResponse.json(payload);
}
