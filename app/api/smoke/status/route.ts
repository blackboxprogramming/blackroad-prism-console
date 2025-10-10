import { NextResponse } from "next/server";

type SmokeStatus = {
  ok: boolean;
  at: string;
  pd?: string;
  jira?: string;
};

const defaultStatus = (): SmokeStatus => ({
  ok: true,
  at: new Date().toISOString(),
  pd: "",
  jira: "",
});

export async function GET() {
  const status = (globalThis as { __SMOKE__?: SmokeStatus }).__SMOKE__;
  return NextResponse.json(status ?? defaultStatus());
}

export async function POST(request: Request) {
  const body = await request.json();
  const payload: SmokeStatus = {
    ok: Boolean(body?.ok),
    at: typeof body?.at === "string" ? body.at : new Date().toISOString(),
    pd: typeof body?.pd === "string" ? body.pd : "",
    jira: typeof body?.jira === "string" ? body.jira : "",
  };

  (globalThis as { __SMOKE__?: SmokeStatus }).__SMOKE__ = payload;

  return NextResponse.json({ ok: true });
}
