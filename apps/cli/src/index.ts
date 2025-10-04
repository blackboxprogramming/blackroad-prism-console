#!/usr/bin/env node
import { Command } from "commander";
import { ClientOnboardingEngine, GateService, sendEnvelope, syncEnvelope } from "@blackroad/core";

const program = new Command();
const engine = new ClientOnboardingEngine();
const gates = new GateService(engine.store, engine.policies);

program
  .name("blackroad-clientos")
  .description("Client onboarding workflows for BlackRoad Finance")
  .version("0.1.0");

program
  .command("start")
  .description("Start onboarding")
  .requiredOption("--type <type>")
  .requiredOption("--channel <channel>")
  .requiredOption("--account <accountType>")
  .action(async (opts) => {
    const result = await engine.start({ type: opts.type, channel: opts.channel, accountType: opts.account });
    console.log(JSON.stringify(result, null, 2));
  });

const kycCmd = program.command("kyc");
kycCmd
  .command("run")
  .description("Run KYC policy")
  .requiredOption("--client <clientId>")
  .action(async (opts) => {
    const result = await engine.runKyc(opts.client);
    console.log(JSON.stringify(result, null, 2));
  });

const suitability = program.command("suitability");
suitability
  .command("score")
  .description("Score suitability")
  .requiredOption("--client <clientId>")
  .option("--riskTolerance <tolerance>", "Moderate")
  .option("--experience <years>", "0")
  .option("--crypto", "Evaluate crypto suitability", false)
  .action(async (opts) => {
    const summary = await engine.scoreSuitability({
      clientId: opts.client,
      riskTolerance: opts.riskTolerance,
      objectives: [],
      timeHorizon: "Medium",
      liquidityNeeds: "Moderate",
      experienceYears: Number(opts.experience),
      crypto: Boolean(opts.crypto),
      questionnaire: {},
    });
    console.log(JSON.stringify(summary, null, 2));
  });

const docs = program.command("docs");
docs
  .command("generate")
  .description("Generate documents")
  .requiredOption("--accountapp <id>")
  .option("--set <set...>", "FORM_CRS")
  .action((opts) => {
    const docsResult = engine.generateDocuments(opts.accountapp, opts.set ?? ["FORM_CRS"]);
    console.log(JSON.stringify(docsResult, null, 2));
  });

const esign = program.command("esign");
esign
  .command("send")
  .description("Send e-sign envelope")
  .requiredOption("--accountapp <id>")
  .option("--doc <doc...>", "ADV_AGREEMENT")
  .action(async (opts) => {
    const envelope = await sendEnvelope(engine, opts.accountapp, opts.doc ?? ["ADV_AGREEMENT"]);
    console.log(JSON.stringify(envelope, null, 2));
  });

esign
  .command("sync")
  .description("Sync e-sign envelope")
  .requiredOption("--envelope <id>")
  .action(async (opts) => {
    const status = await syncEnvelope(engine, opts.envelope);
    console.log(JSON.stringify(status, null, 2));
  });

const gate = program.command("gate");
gate
  .command("check")
  .description("Evaluate a gate")
  .requiredOption("--client <id>")
  .requiredOption("--action <action>")
  .action((opts) => {
    const gateResult = gates.evaluate(opts.client, opts.action);
    console.log(JSON.stringify(gateResult, null, 2));
  });

const wallet = program.command("wallet");
wallet
  .command("add")
  .description("Register and screen a wallet")
  .requiredOption("--client <id>")
  .requiredOption("--chain <chain>")
  .requiredOption("--address <address>")
  .option("--label <label>")
  .action(async (opts) => {
    const walletResult = await engine.addWallet(opts.client, opts.chain, opts.address, opts.label);
    console.log(JSON.stringify(walletResult, null, 2));
  });

program.parseAsync(process.argv);
