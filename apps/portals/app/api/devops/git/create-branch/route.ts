import { NextRequest, NextResponse } from "next/server";
export async function POST(req: NextRequest) {
  const { branch } = await req.json();
  if (!branch || /[^a-zA-Z0-9/_\-]/.test(branch)) {
    return NextResponse.json({ error: "invalid branch" }, { status: 400 });
  }
  // TODO: call GitHub/GitLab to create the branch; record audit trail
  return NextResponse.json({ ok: true, branch });
}
