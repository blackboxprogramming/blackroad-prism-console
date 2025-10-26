#!/usr/bin/env node
import { Command } from "commander";
import pc from "picocolors";
import { lintRunbooks, summarizeReport, writeJsonReport } from "./index.js";
import type { LintOptions, LintMessage } from "./types.js";

function formatMessage({ filePath, runbookId, rule, message, severity }: LintMessage): string {
  const prefix = severity === "error" ? pc.red("✖") : pc.yellow("⚠");
  const scope = runbookId ? `${runbookId} (${rule})` : rule;
  const text = `${prefix} ${pc.bold(scope)}\n    ${message}\n    ${pc.dim(filePath)}`;
  return text;
}

async function run() {
  const program = new Command();
  program
    .name("runbook-lint")
    .description("Validate BlackRoad runbooks")
    .option("-p, --path <path>", "Directory or file containing runbooks", "./runbooks")
    .option("-r, --report <path>", "Write JSON report to path")
    .option("-s, --strict", "Treat warnings as errors", false)
    .option("--owners <path>", "Custom owners registry path");

  program.parse(process.argv);
  const options = program.opts();
  const lintOptions: LintOptions = {
    path: options.path,
    reportPath: options.report,
    strict: options.strict,
    ownersRegistryPath: options.owners
  };

  const report = await lintRunbooks(lintOptions);
  const summary = summarizeReport(report);

  if (report.messages.length === 0) {
    console.log(pc.green("✓ All runbooks passed validation"));
  } else {
    report.messages.forEach((msg) => {
      console.log(formatMessage(msg));
    });
  }

  if (lintOptions.reportPath) {
    await writeJsonReport(lintOptions.reportPath, report);
    console.log(pc.dim(`Report written to ${lintOptions.reportPath}`));
  }

  const total = report.documents.length;
  console.log(
    pc.bold(`Checked ${total} runbook${total === 1 ? "" : "s"}: ${summary.errorCount} errors, ${summary.warningCount} warnings`)
  );

  const failed = summary.errorCount > 0 || (lintOptions.strict && summary.warningCount > 0);
  process.exit(failed ? 1 : 0);
}

run().catch((error) => {
  console.error(pc.red("runbook-lint failed:"), error);
  process.exit(1);
});
