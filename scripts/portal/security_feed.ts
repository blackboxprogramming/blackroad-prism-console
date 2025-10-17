import fs from "fs";
import path from "path";

const SOURCE = process.env.SECURITY_FEED_SOURCE ?? "portal/logs/securityhub_findings.jsonl";
const OUTPUT = process.env.SECURITY_FEED_OUTPUT ?? "portal/reports/security_feed.json";

function ensureDir(filePath: string) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
}

type Finding = {
  severity?: string;
  Severity?: { Label?: string };
  ProductFields?: Record<string, unknown>;
  Resources?: Array<{ Tags?: Record<string, string> }>;
  [key: string]: unknown;
};

function resolveSystem(finding: Finding) {
  const fromField = (finding.ProductFields?.System ?? finding.ProductFields?.system ?? finding["system"]) as string | undefined;
  if (fromField && typeof fromField === "string") return fromField.toLowerCase();
  const resource = finding.Resources?.find((item) => item?.Tags && typeof item.Tags.system === "string");
  if (resource) {
    return resource.Tags!.system.toLowerCase();
  }
  return "unknown";
}

function resolveSeverity(finding: Finding) {
  const raw =
    (typeof finding.severity === "string" && finding.severity) ||
    (finding.Severity?.Label as string | undefined) ||
    (finding["SeverityLabel"] as string | undefined);
  return raw ? raw.toUpperCase() : "";
}

function readFindings(): Finding[] {
  if (!fs.existsSync(SOURCE)) {
    return [];
  }
  const text = fs.readFileSync(SOURCE, "utf-8");
  if (!text.trim()) return [];
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line) as Finding;
      } catch (error) {
        console.warn(`[security-feed] unable to parse line: ${line}`);
        return null;
      }
    })
    .filter((value): value is Finding => Boolean(value));
}

function main() {
  const findings = readFindings();
  const counts: Record<string, number> = {};

  for (const finding of findings) {
    const severity = resolveSeverity(finding);
    if (severity !== "CRITICAL" && severity !== "HIGH") continue;
    const system = resolveSystem(finding);
    counts[system] = (counts[system] ?? 0) + 1;
  }

  ensureDir(OUTPUT);
  fs.writeFileSync(OUTPUT, JSON.stringify(counts, null, 2));
  console.log(`security feed written to ${OUTPUT}`);
}

if (require.main === module) {
  main();
}
