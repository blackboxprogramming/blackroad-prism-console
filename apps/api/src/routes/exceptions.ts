import express from "express";
import { createHmac, randomUUID, timingSafeEqual } from "crypto";

type ExceptionStatus = "pending" | "approved" | "revoked" | "denied";

interface ExceptionRecord {
  id: number;
  status: ExceptionStatus;
  validFrom: Date;
  validUntil?: Date | null;
  updatedAt: Date;
  ruleId?: string;
  orgId?: string;
  subjectType: string;
  subjectId: string;
  requestedBy?: string;
}

interface ExceptionEvent {
  exceptionId: number;
  actor?: string;
  action: string;
  note?: string;
  at: Date;
  correlationId?: string;
}

interface ExtendResult {
  exception: ExceptionRecord;
  changed: boolean;
  capped: boolean;
}

const EXTEND_CAP_MS = 7 * 24 * 60 * 60 * 1000;
const EXTEND_BACKOFF_MS = 30 * 60 * 1000;
const LIST_MAX = 10;
const RATE_LIMIT_MS = 15 * 1000;

const exceptions = new Map<number, ExceptionRecord>();
const events = new Map<number, ExceptionEvent[]>();
const listRateLimit = new Map<string, number>();

const router = express.Router();

class ExtendError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function or<T>(...values: (T | undefined | null)[]): T | undefined {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }
  return undefined;
}

function ensureException(id: number): ExceptionRecord | undefined {
  return exceptions.get(id);
}

function upsertException(record: ExceptionRecord) {
  exceptions.set(record.id, record);
}

function resetStore() {
  exceptions.clear();
  events.clear();
  listRateLimit.clear();
}

function recordEvent(evt: ExceptionEvent) {
  const existing = events.get(evt.exceptionId) ?? [];
  existing.push(evt);
  events.set(evt.exceptionId, existing);
}

function lastEvent(id: number, action: string): ExceptionEvent | undefined {
  const existing = events.get(id);
  if (!existing || existing.length === 0) {
    return undefined;
  }
  for (let i = existing.length - 1; i >= 0; i -= 1) {
    if (existing[i].action === action) {
      return existing[i];
    }
  }
  return undefined;
}

function applyExtend(
  id: number,
  until: Date,
  actor?: string,
  correlationId?: string,
  now: Date = new Date()
): ExtendResult {
  const exception = ensureException(id);
  if (!exception) {
    throw new ExtendError(404, "not_found", "not found");
  }
  if (exception.status !== "approved") {
    throw new ExtendError(409, "not_approved", "not approved");
  }

  if (!(until instanceof Date) || Number.isNaN(until.getTime())) {
    throw new ExtendError(400, "bad_until", "bad until");
  }

  if (until.getTime() <= now.getTime()) {
    throw new ExtendError(400, "until_not_future", "until must be in future");
  }

  const recent = lastEvent(id, "extend");
  if (recent && now.getTime() - recent.at.getTime() < EXTEND_BACKOFF_MS) {
    throw new ExtendError(429, "extend_backoff", "extend backoff (try later)");
  }

  const capAt = new Date(exception.validFrom.getTime() + EXTEND_CAP_MS);
  let effectiveUntil = until;
  let capped = false;
  if (effectiveUntil.getTime() > capAt.getTime()) {
    effectiveUntil = capAt;
    capped = true;
  }

  const base = exception.validUntil ?? null;
  if (base && effectiveUntil.getTime() <= base.getTime()) {
    return { exception, changed: false, capped };
  }

  exception.validUntil = effectiveUntil;
  exception.updatedAt = now;
  recordEvent({
    exceptionId: exception.id,
    actor,
    action: "extend",
    note: `extend-to ${effectiveUntil.toISOString()}`,
    at: now,
    correlationId,
  });

  return { exception, changed: true, capped };
}

function listActiveExceptions(filters: {
  orgId?: string;
  ruleId?: string;
  subject?: string;
}) {
  const now = Date.now();
  const subjectType = filters.subject?.split(":")[0];
  const subjectId = filters.subject?.split(":").slice(1).join(":");
  return Array.from(exceptions.values())
    .filter((exc) => {
      if (exc.status !== "approved") {
        return false;
      }
      if (exc.validUntil && exc.validUntil.getTime() <= now) {
        return false;
      }
      if (filters.orgId && exc.orgId !== filters.orgId) {
        return false;
      }
      if (filters.ruleId && exc.ruleId !== filters.ruleId) {
        return false;
      }
      if (filters.subject && (!subjectType || !subjectId)) {
        return false;
      }
      if (subjectType && exc.subjectType !== subjectType) {
        return false;
      }
      if (subjectId && exc.subjectId !== subjectId) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      const aUntil = a.validUntil?.getTime() ?? Number.POSITIVE_INFINITY;
      const bUntil = b.validUntil?.getTime() ?? Number.POSITIVE_INFINITY;
      return aUntil - bUntil;
    });
}

function parseKV(text: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!text) {
    return result;
  }
  const parts = text.trim().split(/\s+/);
  for (const part of parts) {
    const idx = part.indexOf("=");
    if (idx === -1) {
      continue;
    }
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (key) {
      result[key] = value;
    }
  }
  return result;
}

function prettyFilter(org?: string, rule?: string, subj?: string) {
  const bits: string[] = [];
  if (org) bits.push(`org \`${org}\``);
  if (rule) bits.push(`rule \`${rule}\``);
  if (subj) bits.push(`subject \`${subj}\``);
  if (bits.length === 0) return "";
  return ` (${bits.join(", ")})`;
}

function section(text: string) {
  return {
    type: "section",
    text: {
      type: "mrkdwn",
      text,
    },
  };
}

function button(text: string, style: "primary" | "danger" | "default", actionId: string, value: string) {
  return {
    type: "button",
    text: {
      type: "plain_text",
      text,
      emoji: true,
    },
    style: style === "default" ? undefined : style,
    action_id: actionId,
    value,
  };
}

function verifySlack(req: express.Request) {
  const secret = process.env.SLACK_SIGNING_SECRET;
  if (!secret) {
    return false;
  }
  const timestamp = req.headers["x-slack-request-timestamp"];
  const signature = req.headers["x-slack-signature"];
  if (typeof timestamp !== "string" || typeof signature !== "string") {
    return false;
  }
  const rawBody = (req as any).rawBody ?? "";
  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) {
    return false;
  }
  if (Math.abs(Date.now() / 1000 - ts) > 60 * 5) {
    return false;
  }
  const hmac = createHmac("sha256", secret);
  hmac.update(`v0:${timestamp}:${rawBody}`);
  const digest = `v0=${hmac.digest("hex")}`;
  const digestBuffer = Buffer.from(digest, "utf8");
  const sigBuffer = Buffer.from(signature, "utf8");
  if (digestBuffer.length !== sigBuffer.length) {
    return false;
  }
  return timingSafeEqual(digestBuffer, sigBuffer);
}

function ackModalError(message: string) {
  return {
    response_action: "errors",
    errors: {
      time: message,
    },
  };
}

function textValue(block: any, actionId: string) {
  const item = block?.[actionId];
  if (!item) {
    return "";
  }
  if (typeof item.value === "string") {
    return item.value;
  }
  if (typeof item.text === "string") {
    return item.text;
  }
  return "";
}

function textOrSel(values: any, blockId: string, actionId: string) {
  const block = values?.[blockId];
  const text = textValue(block, actionId);
  if (text) {
    return text;
  }
  const item = block?.[actionId];
  if (item && typeof item.selected_date === "string") {
    return item.selected_date;
  }
  return "";
}

function getSlackCorrelationId(payload: any) {
  return (
    payload?.view?.id ||
    payload?.trigger_id ||
    payload?.container?.message_ts ||
    payload?.message?.ts ||
    undefined
  );
}

function encodeCtx(ctx: Record<string, string | undefined>) {
  return JSON.stringify(ctx);
}

function decodeCtx(value: string | undefined) {
  if (!value) return {} as Record<string, string>;
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === "object") {
      return parsed as Record<string, string>;
    }
  } catch (err) {
    console.error("failed to decode context", err);
  }
  return {} as Record<string, string>;
}

async function postSlack(url: string, payload: any) {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) {
    return;
  }
  await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

router.post("/exceptions/:id/extend-to", (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) {
    return res.status(400).send("bad id");
  }
  const actor = or(req.body?.actor, req.get("x-actor"));
  const untilStr = req.body?.until;
  if (!untilStr || typeof untilStr !== "string") {
    return res.status(400).send("missing until");
  }
  const parsedUntil = new Date(untilStr);
  try {
    const result = applyExtend(
      id,
      parsedUntil,
      typeof actor === "string" ? actor : undefined,
      req.get("x-correlation-id") ?? undefined
    );
    return res.json({
      id,
      status: result.exception.status,
      valid_until: result.exception.validUntil?.toISOString() ?? null,
      capped: result.capped,
    });
  } catch (err) {
    if (err instanceof ExtendError) {
      return res.status(err.status).send(err.message);
    }
    console.error(err);
    return res.status(500).send("internal error");
  }
});

router.get("/exceptions/active", (_req, res) => {
  const orgId = typeof _req.query.org_id === "string" ? _req.query.org_id : undefined;
  const ruleId = typeof _req.query.rule_id === "string" ? _req.query.rule_id : undefined;
  const subject = typeof _req.query.subject === "string" ? _req.query.subject : undefined;
  const items = listActiveExceptions({ orgId, ruleId, subject }).map((exc) => ({
    id: exc.id,
    subjectType: exc.subjectType,
    subjectId: exc.subjectId,
    requestedBy: exc.requestedBy ?? "",
    validUntil: exc.validUntil ? new Date(exc.validUntil) : null,
  }));
  res.json({ items });
});

router.post("/slack/exceptions-list", (req, res) => {
  if (!verifySlack(req)) {
    return res.status(401).send("bad signature");
  }
  const userKey = String(req.body?.user_id ?? req.body?.user_name ?? "anon");
  const now = Date.now();
  const recent = listRateLimit.get(userKey) ?? 0;
  if (now - recent < RATE_LIMIT_MS) {
    listRateLimit.set(userKey, now);
    return res.json({
      response_type: "ephemeral",
      text: "Please wait a few seconds before requesting the list again.",
    });
  }
  listRateLimit.set(userKey, now);

  const args = parseKV(typeof req.body?.text === "string" ? req.body.text : "");
  const org = args.org;
  const rule = args.rule;
  const subject = args.subject;

  const queryItems = listActiveExceptions({ orgId: org, ruleId: rule, subject });
  if (queryItems.length === 0) {
    return res.json({
      response_type: "ephemeral",
      text: `No active exceptions${prettyFilter(org, rule, subject)}.`,
    });
  }
  const max = Math.min(LIST_MAX, queryItems.length);
  const isSecops =
    typeof req.body?.channel_name === "string" &&
    req.body.channel_name.toLowerCase() === "secops";
  const header = section(`*Active exceptions${prettyFilter(org, rule, subject)}*`);
  const blocks: any[] = [header];

  if (isSecops) {
    for (let i = 0; i < max; i += 1) {
      const item = queryItems[i];
      const until = item.validUntil?.toISOString() ?? "(none)";
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `• \`#${item.id}\` — \`${item.subjectType}:${item.subjectId}\` — by *${
            item.requestedBy || "?"
          }* — until _${until}_`,
        },
        accessory: button(
          "Revoke",
          "danger",
          "revoke_exception",
          encodeCtx({ exc_id: String(item.id) })
        ),
      });
    }
    if (queryItems.length > max) {
      blocks.push(section(`_…and ${queryItems.length - max} more_`));
    }
    return res.json({ response_type: "in_channel", blocks });
  }

  const lines: string[] = [];
  for (let i = 0; i < max; i += 1) {
    const item = queryItems[i];
    const until = item.validUntil?.toISOString() ?? "(none)";
    lines.push(
      `• \`#${item.id}\` — \`${item.subjectType}:${item.subjectId}\` — by *${
        item.requestedBy || "?"
      }* — until _${until}_`
    );
  }
  if (queryItems.length > max) {
    lines.push(`_…and ${queryItems.length - max} more_`);
  }

  return res.json({
    response_type: "ephemeral",
    blocks: [header, section(lines.join("\n"))],
  });
});

router.post("/slack/interactivity", async (req, res) => {
  if (!verifySlack(req)) {
    return res.status(401).send("bad signature");
  }
  const payloadStr = req.body?.payload;
  if (typeof payloadStr !== "string") {
    return res.status(400).send("missing payload");
  }
  let payload: any;
  try {
    payload = JSON.parse(payloadStr);
  } catch (err) {
    console.error("invalid payload", err);
    return res.status(400).send("bad payload");
  }

  const correlationId = getSlackCorrelationId(payload) ?? randomUUID();

  if (payload.type === "block_actions" && Array.isArray(payload.actions)) {
    const action = payload.actions[0];
    if (action?.action_id === "extend_to_modal") {
      const ctx = {
        exc_id: action.value ? decodeCtx(action.value).exc_id ?? "" : "",
        channel: payload.channel?.id,
        message_ts: payload.message?.ts,
      } as Record<string, string>;
      const view = {
        type: "modal",
        callback_id: "extend_to_submit",
        title: { type: "plain_text", text: "Extend Exception" },
        submit: { type: "plain_text", text: "Set" },
        private_metadata: encodeCtx(ctx),
        blocks: [
          {
            type: "input",
            block_id: "date",
            label: { type: "plain_text", text: "Date (UTC)" },
            element: {
              type: "datepicker",
              action_id: "date",
              placeholder: { type: "plain_text", text: "YYYY-MM-DD" },
            },
          },
          {
            type: "input",
            block_id: "time",
            label: { type: "plain_text", text: "Time (HH:MM, UTC)" },
            element: {
              type: "plain_text_input",
              action_id: "time",
              placeholder: { type: "plain_text", text: "23:59" },
            },
          },
        ],
      };

      await postSlack("https://slack.com/api/views.open", {
        trigger_id: payload.trigger_id,
        view,
      });
      return res.json({ ok: true });
    }
    if (action?.action_id === "revoke_exception") {
      const ctx = decodeCtx(action.value);
      const id = Number.parseInt(ctx.exc_id ?? "", 10);
      if (Number.isFinite(id)) {
        const exception = ensureException(id);
        if (exception) {
          exception.status = "revoked";
          exception.updatedAt = new Date();
          recordEvent({
            exceptionId: id,
            actor: payload.user?.username ?? payload.user?.name,
            action: "revoke",
            note: "revoked via slack",
            at: new Date(),
            correlationId,
          });
        }
      }
      return res.json({});
    }
  }

  if (payload.type === "view_submission" && payload.view?.callback_id === "extend_to_submit") {
    const ctx = decodeCtx(payload.view?.private_metadata);
    const excId = Number.parseInt(ctx.exc_id ?? "", 10);
    if (!Number.isFinite(excId)) {
      return res.json(ackModalError("Missing exception ID"));
    }
    const date = textOrSel(payload.view?.state?.values, "date", "date");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.json(ackModalError("Select a valid date"));
    }
    const time = textValue(payload.view?.state?.values?.time, "time");
    if (!/^\d{2}:\d{2}$/.test(time)) {
      return res.json(ackModalError("Use HH:MM"));
    }
    const untilStr = `${date}T${time}:00Z`;
    try {
      const result = applyExtend(
        excId,
        new Date(untilStr),
        payload.user?.username ?? payload.user?.name,
        correlationId
      );
      if (result.capped && ctx.channel && ctx.message_ts) {
        await postSlack("https://slack.com/api/chat.postMessage", {
          channel: ctx.channel,
          thread_ts: ctx.message_ts,
          text: `Extended to cap (ends ${result.exception.validUntil?.toISOString()}). Further extension requires admin.`,
        });
      }
      return res.json({ response_action: "clear" });
    } catch (err) {
      if (err instanceof ExtendError) {
        if (err.status === 429) {
          return res.json({
            response_action: "errors",
            errors: { time: "Extended recently. Try again in ~30 minutes." },
          });
        }
        return res.json(ackModalError("Invalid date/time or over 7-day cap."));
      }
      console.error(err);
      return res.status(500).send("internal error");
    }
  }

  return res.json({ ok: true });
});

export {
  applyExtend,
  ensureException,
  exceptions,
  recordEvent,
  upsertException,
  resetStore,
};

export default router;
