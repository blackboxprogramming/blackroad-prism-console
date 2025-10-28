import { NextRequest, NextResponse } from "next/server";
export async function POST(req: NextRequest) {
  const { branch } = await req.json();
  if (!branch || /[^a-zA-Z0-9/_\-]/.test(branch)) {
    return NextResponse.json({ error: "invalid branch" }, { status: 400 });
  }
  console.log(`create-branch stub: ${branch}`);
  return NextResponse.json({ ok: true, branch });
}
