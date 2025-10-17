import { NextRequest } from "next/server";

export interface OpsContext {
  email: string;
  groups: string[];
}

const allowedGroups = new Set(["ops", "security"]);

function parseGroups(header: string | null): string[] {
  if (!header) return [];
  return header
    .split(",")
    .map((g) => g.trim())
    .filter(Boolean);
}

export function requireOpsAccess(req: NextRequest): OpsContext {
  const email = (req.headers.get("x-user-email") || "").trim();
  const groups = parseGroups(req.headers.get("x-user-groups"));
  const normalized = groups.map((g) => g.toLowerCase());
  const hasGroup = normalized.some((g) => allowedGroups.has(g));

  const domainOk = email.endsWith("@blackroadinc.us");

  const devBypass =
    process.env.NODE_ENV !== "production" && process.env.PD_DEV_BYPASS === "1";

  if ((hasGroup && domainOk) || devBypass) {
    return {
      email: email || process.env.PD_DEV_EMAIL || "ops@blackroadinc.us",
      groups,
    };
  }

  throw new Error("forbidden");
}
