import fs from "node:fs";
import path from "node:path";
import yaml from "yaml";
import type { Runbook } from "@blackroad/runbook-types";
import { runbookSchema } from "@blackroad/runbook-types";
import type { LintMessage, OwnerRegistry, RunbookDocument } from "./types.js";

const OWNER_PATTERN = /^[a-z0-9-_]+$/;
const WORKFLOW_PATTERN = /^[a-z0-9][a-z0-9_.:-]{2,}$/;
const SECRET_PATTERN = /(token|secret|password|apikey|key)[^a-z0-9]*[a-z0-9]{10,}/i;

export function loadOwnerRegistry(rootDir: string, registryPath?: string): OwnerRegistry {
  const resolved = registryPath
    ? path.resolve(rootDir, registryPath)
    : path.resolve(rootDir, "OWNERS.yml");

  if (!fs.existsSync(resolved)) {
    return { owners: new Set() };
  }

  const contents = fs.readFileSync(resolved, "utf8");
  const data = yaml.parse(contents) ?? {};
  const ownersList: string[] = [
    ...(Array.isArray(data.teams) ? data.teams : []),
    ...(Array.isArray(data.individuals) ? data.individuals : [])
  ];

  return { owners: new Set(ownersList.filter((owner) => typeof owner === "string")) };
}

function checkOwnerPolicies(runbook: Runbook, filePath: string, registry: OwnerRegistry): LintMessage[] {
  const messages: LintMessage[] = [];

  runbook.metadata.owners.forEach((owner) => {
    if (!OWNER_PATTERN.test(owner)) {
      messages.push({
        filePath,
        runbookId: runbook.metadata.id,
        rule: "owner-format",
        severity: "error",
        message: `Owner "${owner}" must match ${OWNER_PATTERN}`,
        hint: "Use lowercase letters, numbers, hyphen, or underscore."
      });
    }
    if (registry.owners.size > 0 && !registry.owners.has(owner)) {
      messages.push({
        filePath,
        runbookId: runbook.metadata.id,
        rule: "owner-registry",
        severity: "error",
        message: `Owner "${owner}" is not registered in OWNERS.yml`,
        hint: "Add the owner to OWNERS.yml or select a registered owner."
      });
    }
  });

  return messages;
}

function collectStrings(value: unknown, collector: (value: string) => void): void {
  if (typeof value === "string") {
    collector(value);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectStrings(item, collector));
    return;
  }
  if (value && typeof value === "object") {
    Object.values(value).forEach((item) => collectStrings(item, collector));
  }
}

function detectSecrets(runbook: Runbook, filePath: string): LintMessage[] {
  const messages: LintMessage[] = [];
  collectStrings(runbook, (val) => {
    if (val.includes("${")) {
      return;
    }
    if (val.startsWith("http")) {
      return;
    }
    if (SECRET_PATTERN.test(val)) {
      messages.push({
        filePath,
        runbookId: runbook.metadata.id,
        rule: "potential-secret",
        severity: "error",
        message: `Value "${val}" looks like a secret. Use parameter references instead.`,
        hint: "Replace secrets with variable placeholders or parameter names."
      });
    }
  });
  return messages;
}

function validateExecution(runbook: Runbook, filePath: string): LintMessage[] {
  const messages: LintMessage[] = [];
  if (!WORKFLOW_PATTERN.test(runbook.execution.workflowName)) {
    messages.push({
      filePath,
      runbookId: runbook.metadata.id,
      rule: "workflow-format",
      severity: "error",
      message: `Execution workflow name "${runbook.execution.workflowName}" must match ${WORKFLOW_PATTERN}`,
      hint: "Use lowercase letters, numbers, hyphen, underscore, colon, or period."
    });
  }
  if (!runbook.execution.version.trim()) {
    messages.push({
      filePath,
      runbookId: runbook.metadata.id,
      rule: "workflow-version",
      severity: "error",
      message: "Execution version must be provided",
      hint: "Set execution.version to the RoadGlitch workflow version."
    });
  }
  runbook.steps.forEach((step) => {
    if (step.kind === "execute") {
      if (!step.execute) {
        messages.push({
          filePath,
          runbookId: runbook.metadata.id,
          rule: "execute-step",
          severity: "error",
          message: `Execute step "${step.id}" must define execute.action and execute.inputs`
        });
      }
    }
    if (step.kind === "verify" && !step.verify) {
      messages.push({
        filePath,
        runbookId: runbook.metadata.id,
        rule: "verify-step",
        severity: "error",
        message: `Verify step "${step.id}" must define a verify description."
      });
    }
  });
  return messages;
}

export function evaluatePolicies(
  documents: RunbookDocument[],
  registry: OwnerRegistry
): LintMessage[] {
  const messages: LintMessage[] = [];
  const seenIds = new Map<string, string>();

  documents.forEach(({ runbook, filePath }) => {
    if (!runbook) return;
    if (seenIds.has(runbook.metadata.id)) {
      messages.push({
        filePath,
        runbookId: runbook.metadata.id,
        rule: "unique-id",
        severity: "error",
        message: `Runbook id "${runbook.metadata.id}" is duplicated (also found in ${path.basename(
          seenIds.get(runbook.metadata.id) ?? ""
        )})`,
        hint: "Ensure each runbook metadata.id is unique."
      });
    } else {
      seenIds.set(runbook.metadata.id, filePath);
    }

    messages.push(...checkOwnerPolicies(runbook, filePath, registry));
    messages.push(...detectSecrets(runbook, filePath));
    messages.push(...validateExecution(runbook, filePath));
  });

  return messages;
}

export function parseRunbookDocument(filePath: string, contents: string): RunbookDocument {
  const parsed = yaml.parse(contents);
  const validation = runbookSchema.safeParse(parsed);
  if (!validation.success) {
    const flattened = validation.error.flatten();
    const issues = flattened.fieldErrors;
    const firstIssue = Object.entries(issues)[0];
    const message = firstIssue
      ? `${firstIssue[0]}: ${firstIssue[1]?.join(", ")}`
      : validation.error.message;
    return {
      filePath,
      runbook: undefined,
      parseError: message
    };
  }
  return { filePath, runbook: validation.data };
}
