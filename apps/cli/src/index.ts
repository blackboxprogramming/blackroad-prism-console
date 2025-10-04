#!/usr/bin/env node
import { Command } from "commander";
import { initCommand } from "./commands/init.js";
import { ingestBrokerCheck } from "./commands/ingest.js";
import { syncCommand } from "./commands/sync.js";
import { planCommand } from "./commands/plan.js";
import { gateCommand } from "./commands/gate.js";

const program = new Command();
program
  .name("blackroad-lic")
  .description("BlackRoad licensing orchestrator CLI")
  .version("0.1.0");

program
  .command("init")
  .requiredOption("--person <name>", "Legal name of the person")
  .option("--crd <number>", "CRD number")
  .requiredOption("--home <state>", "Home state (e.g., MN)")
  .requiredOption("--tracks <list>", "Comma separated tracks (securities,insurance,real_estate)")
  .requiredOption("--states <list>", "Comma separated target states")
  .action((options) => {
    initCommand(options);
  });

program
  .command("ingest")
  .description("Ingest external data sources")
  .command("brokercheck <file>")
  .description("Parse BrokerCheck PDF")
  .action(async (file: string) => {
    await ingestBrokerCheck(file);
  });

program
  .command("sync")
  .description("Sync license data from state portals")
  .option("--states <list>", "States to sync, default all")
  .option("--tracks <list>", "Tracks to sync, default all")
  .action((options) => {
    syncCommand(options);
  });

program
  .command("plan")
  .description("Generate reinstatement plan")
  .requiredOption("--states <list|all>", "States to include or 'all'")
  .requiredOption("--tracks <list|all>", "Tracks to include or 'all'")
  .option("--out <path>", "Optional output file")
  .option("--print-md", "Print markdown summary", false)
  .action((options) => {
    planCommand({
      states: options.states,
      tracks: options.tracks,
      out: options.out,
      printMd: options.printMd,
    });
  });

program
  .command("gate")
  .description("Evaluate compliance gates")
  .requiredOption("--action <advise|sell-insurance|trade-bd>", "Action to evaluate")
  .requiredOption("--state <state>", "State code")
  .option("--line <line>", "Insurance line for sell-insurance action")
  .action((options) => {
    gateCommand(options);
  });

program.parseAsync(process.argv).catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error.message);
  process.exitCode = 1;
});
