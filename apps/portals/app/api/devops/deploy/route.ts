import { NextRequest, NextResponse } from "next/server";
export async function POST(req: NextRequest) {
  const { notes } = await req.json();
  console.log("deploy stub", notes);
  return NextResponse.json({ ok: true, notes: notes ?? "" });
}
