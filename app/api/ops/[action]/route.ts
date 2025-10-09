import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const ACTION_ENDPOINTS: Record<string, string | undefined> = {
  "go-no-go": process.env.OPS_ACTION_GO_NO_GO_URL ?? process.env.GO_NO_GO_URL,
  ladder: process.env.OPS_ACTION_LADDER_URL ?? process.env.CANARY_LADDER_URL,
  rollback: process.env.OPS_ACTION_ROLLBACK_URL ?? process.env.ROLLBACK_URL
};

const OPS_ENVIRONMENT = process.env.OPERATIONS_ENVIRONMENT ?? process.env.NODE_ENV ?? "production";
const SLACK_WEBHOOK = process.env.SLACK_WEBHOOK ?? process.env.OPS_SLACK_WEBHOOK;
const GITHUB_TOKEN = process.env.OPS_GITHUB_TOKEN ?? process.env.GITHUB_TOKEN;

async function sendSlackNotification(action: string, actor: string) {
  if (!SLACK_WEBHOOK) return;
  try {
    await fetch(SLACK_WEBHOOK, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: `Ops action: ${actor} triggered ${action} on ${OPS_ENVIRONMENT}` })
    });
  } catch (error) {
    console.warn("[ops] failed to send slack notification", error);
  }
}

export async function POST(request: NextRequest, { params }: { params: { action: string } }) {
  const action = params.action;
  const endpoint = ACTION_ENDPOINTS[action];

  if (!endpoint) {
    return NextResponse.json({ error: `Action '${action}' is not configured.` }, { status: 501 });
  }

  const actor =
    request.headers.get("x-ops-user") ??
    request.headers.get("x-forwarded-email") ??
    request.headers.get("x-user-email") ??
    request.headers.get("x-github-actor") ??
    "ops-portal";

  let upstreamBody: string | undefined;
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      const raw = await request.text();
      upstreamBody = raw && raw.length ? raw : undefined;
    } catch (error) {
      console.warn("[ops] failed to read request body", error);
    }
  }

  if (!upstreamBody) {
    upstreamBody = JSON.stringify({ action, actor, environment: OPS_ENVIRONMENT });
  }

  const headers: Record<string, string> = {
    "content-type": "application/json"
  };

  if (GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
    headers.Accept = "application/vnd.github+json";
  }

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(endpoint, {
      method: "POST",
      headers,
      body: upstreamBody
    });
  } catch (error) {
    console.error(`[ops] action ${action} failed to reach upstream`, error);
    return NextResponse.json({ error: `Failed to reach upstream for ${action}` }, { status: 502 });
  }

  let responseBody: any = null;
  const responseText = await upstreamResponse.text();
  try {
    responseBody = responseText ? JSON.parse(responseText) : null;
  } catch {
    responseBody = responseText || null;
  }

  if (upstreamResponse.ok) {
    await sendSlackNotification(action, actor);
  }

  return NextResponse.json(
    {
      ok: upstreamResponse.ok,
      status: upstreamResponse.status,
      upstream: responseBody ?? undefined
    },
    { status: upstreamResponse.ok ? 200 : upstreamResponse.status }
  );
}

export async function GET(_: NextRequest, { params }: { params: { action: string } }) {
  const action = params.action;
  if (!Object.prototype.hasOwnProperty.call(ACTION_ENDPOINTS, action)) {
    return NextResponse.json({ error: `Action '${action}' is not supported.` }, { status: 404 });
  }
  return NextResponse.json({ action, configured: Boolean(ACTION_ENDPOINTS[action]) });
}
