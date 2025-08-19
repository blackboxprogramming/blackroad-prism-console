import { NextRequest, NextResponse } from "next/server";
export async function POST(req: NextRequest) {
  const { notes } = await req.json();
  // TODO: trigger your CI/CD (GitHub Actions, DO droplet webhook, etc.); record audit trail
  return NextResponse.json({ ok: true, notes: notes ?? "" });
}
