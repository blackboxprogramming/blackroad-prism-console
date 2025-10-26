import fs from "node:fs/promises";
import path from "node:path";
import fg from "fast-glob";
import { parseRunbookDocument, evaluatePolicies, loadOwnerRegistry } from "./policy.js";
import type { LintOptions, LintReport, LintMessage, RunbookDocument } from "./types.js";

const YAML_GLOB = "**/*.yaml";

async function readFileSafe(filePath: string): Promise<string | undefined> {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch (error) {
    return undefined;
  }
}

export async function loadRunbookDocuments(options: LintOptions): Promise<RunbookDocument[]> {
  const resolvedPath = path.resolve(options.path);
  let files: string[] = [];
  try {
    const stats = await fs.stat(resolvedPath);
    if (stats.isDirectory()) {
      files = await fg(YAML_GLOB, { cwd: resolvedPath, absolute: true, dot: false });
    } else {
      files = [resolvedPath];
    }
  } catch (error) {
    return [
      {
        filePath: resolvedPath,
        parseError: `Path not found: ${resolvedPath}`
      }
    ];
  }

  const documents: RunbookDocument[] = [];

  for (const file of files) {
    const contents = await readFileSafe(file);
    if (!contents) {
      documents.push({ filePath: file, parseError: "Unable to read file" });
      continue;
    }
    try {
      documents.push(parseRunbookDocument(file, contents));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      documents.push({ filePath: file, parseError: message });
    }
  }

  return documents;
}

function collectParseMessages(documents: RunbookDocument[]): LintMessage[] {
  return documents
    .filter((doc) => doc.parseError)
    .map((doc) => ({
      filePath: doc.filePath,
      rule: "schema",
      severity: "error",
      message: doc.parseError ?? "Invalid runbook file"
    }));
}

export async function lintRunbooks(options: LintOptions): Promise<LintReport> {
  const documents = await loadRunbookDocuments(options);
  const parseMessages = collectParseMessages(documents);
  const registry = loadOwnerRegistry(process.cwd(), options.ownersRegistryPath);
  const policyMessages = evaluatePolicies(documents, registry);
  const messages = [...parseMessages, ...policyMessages];
  return { documents, messages };
}

export async function writeJsonReport(reportPath: string, report: LintReport): Promise<void> {
  const payload = {
    generatedAt: new Date().toISOString(),
    documents: report.documents.map((doc) => ({
      filePath: doc.filePath,
      runbookId: doc.runbook?.metadata.id,
      parseError: doc.parseError ?? null
    })),
    messages: report.messages
  };
  await fs.mkdir(path.dirname(path.resolve(reportPath)), { recursive: true });
  await fs.writeFile(reportPath, JSON.stringify(payload, null, 2), "utf8");
}

export function summarizeReport(report: LintReport): {
  errorCount: number;
  warningCount: number;
  ok: boolean;
} {
  const errorCount = report.messages.filter((msg) => msg.severity === "error").length;
  const warningCount = report.messages.filter((msg) => msg.severity === "warning").length;
  return { errorCount, warningCount, ok: errorCount === 0 };
}
