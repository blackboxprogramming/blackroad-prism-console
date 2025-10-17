import { createHash } from "crypto";

export function hashPayload(input: unknown): string {
  const json = typeof input === "string" ? input : JSON.stringify(input ?? {});
  return createHash("sha256").update(json).digest("hex");
}
