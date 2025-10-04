#!/usr/bin/env node
import { Command } from "commander";
import { readFile } from "fs/promises";
import { createInMemoryDb } from "@blackroad/compliance-db";
import { gate, publishPolicy, recordAttestation } from "@blackroad/compliance-core";
import { advertising } from "@blackroad/compliance-reviewers";
import { verifyWormChain } from "@blackroad/compliance-archival";

const db = createInMemoryDb();
const program = new Command();
program.name("blackroad-compliance-os").description("Compliance OS CLI for Alexa Louise Amundson").version("0.1.0");

program
  .command("policy publish <file>")
  .description("Publish or update a policy definition")
  .action(async (file) => {
    const raw = await readFile(file, "utf-8");
    const payload = JSON.parse(raw);
    const record = await publishPolicy({
      db,
      actor: { id: "alexa", role: "admin", name: "Alexa Louise Amundson" },
      key: payload.key,
      title: payload.title,
      body: payload.body,
      controls: payload.controls ?? [],
      effectiveAt: new Date(payload.effectiveAt ?? new Date().toISOString()),
      status: payload.status ?? "Active",
    });
    console.log(`Published policy ${record.key} v${record.version}`);
  });

program
  .command("attest")
  .description("Record a policy attestation")
  .requiredOption("--policy <key>")
  .requiredOption("--user <id>")
  .requiredOption("--period <period>")
  .action(async (options) => {
    const attestation = await recordAttestation({
      db,
      policyKey: options.policy,
      userId: options.user,
      period: options.period,
      answers: { attestedAt: new Date().toISOString() },
    });
    console.log(`Recorded attestation ${attestation.id}`);
  });

const review = program.command("review").description("Run a review workflow");

review
  .command("advertising")
  .requiredOption("--in <file>")
  .option("--meta <file>")
  .action(async (opts) => {
    const content = await readFile(opts.in, "utf-8").catch(() => "");
    const meta = opts.meta ? JSON.parse(await readFile(opts.meta, "utf-8")) : {};
    const reviewResult = await advertising.runReview(db, {
      title: meta.title ?? opts.in,
      contentUrl: opts.in,
      content,
      containsPerformance: meta.containsPerformance,
      performancePeriods: meta.performancePeriods,
      containsTestimonials: meta.containsTestimonials,
      disclosures: meta.disclosures,
      cta: meta.cta,
      hypothetical: meta.hypothetical,
      thirdPartyRatings: meta.thirdPartyRatings,
    });
    console.log(JSON.stringify({
      reviewId: reviewResult.review.id,
      outcome: reviewResult.outcome,
      breaches: reviewResult.aggregate.breaches,
      riskScore: reviewResult.aggregate.riskScore,
    }, null, 2));
  });

review
  .command("aml")
  .requiredOption("--in <file>")
  .action(async () => {
    console.log("TODO: Implement AML review. Escalate to compliance officer.");
  });

program
  .command("gate <action>")
  .option("--state <state>")
  .option("--ce-complete")
  .action(async (action, options) => {
    const result = await gate(db, action, {
      state: options.state,
      ceCompleted: options.ceComplete ?? true,
    });
    console.log(JSON.stringify(result, null, 2));
  });

program
  .command("calendar list")
  .option("--open", "Only show open items")
  .action(async (options) => {
    const items = await db.calendar.listOpen();
    console.table(
      items.filter((item) => (options.open ? item.status === "Open" : true)).map((item) => ({
        id: item.id,
        key: item.key,
        due: item.due.toISOString(),
        status: item.status,
      }))
    );
  });

program
  .command("worm verify")
  .action(async () => {
    const result = await verifyWormChain(db);
    if (result.ok) {
      console.log("WORM chain verified");
    } else {
      console.error("WORM verification failed", result.issues);
      process.exitCode = 1;
    }
  });

program
  .command("audit export")
  .requiredOption("--out <file>")
  .action(async (options) => {
    console.log(`TODO: generate audit export at ${options.out}`);
  });

program.parseAsync(process.argv);
