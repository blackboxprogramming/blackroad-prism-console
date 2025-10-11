#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { Command } from "commander";
import { PrismaClient } from "@prisma/client";
import { PrismaWormLedger } from "@blackroad/worm";
import {
  DEFAULT_POLICY_CONTEXT,
  EntitlementService,
  PrismaGrcRepository,
  RfcService,
  SodEngine,
  VendorService,
  IncidentService,
  BcpService,
  KriService,
  type PolicyContext,
} from "@blackroad/grc-core";

interface CliContext {
  prisma: PrismaClient;
  policy: PolicyContext;
  repository: PrismaGrcRepository;
  worm: PrismaWormLedger;
  entitlements: EntitlementService;
  rfc: RfcService;
  vendor: VendorService;
  incidents: IncidentService;
  bcp: BcpService;
  kri: KriService;
}

async function createContext(): Promise<CliContext> {
  const prisma = new PrismaClient();
  const worm = new PrismaWormLedger(prisma);
  const repository = new PrismaGrcRepository(prisma);
  const policy = DEFAULT_POLICY_CONTEXT;
  const sod = new SodEngine(repository, worm, policy);
  const entitlements = new EntitlementService(repository, sod, worm, policy);
  const rfc = new RfcService(repository, worm);
  const vendor = new VendorService(repository, worm);
  const incidents = new IncidentService(repository, worm, policy);
  const bcp = new BcpService(repository, worm, policy);
  const kri = new KriService(repository, worm);
  return { prisma, policy, repository, worm, entitlements, rfc, vendor, incidents, bcp, kri };
}

async function main(): Promise<void> {
  const program = new Command();
  program.name("blackroad-grc").description("BlackRoad GRC administration CLI");

  program
    .command("roles seed")
    .option("--preset <preset>", "Seed preset", "blackroad")
    .action(async (options) => {
      const ctx = await createContext();
      try {
        if (options.preset === "blackroad") {
          const roles = [
            { key: "GRC_ADMIN", title: "GRC Administrator" },
            { key: "BILLING_ISSUER", title: "Billing Issuer" },
            { key: "PAYMENTS_POSTER", title: "Payments Poster" },
            { key: "ADS_APPROVER", title: "Ads Approver" },
            { key: "ADS_PUBLISHER", title: "Ads Publisher" },
          ];
          for (const role of roles) {
            const existing = await ctx.repository.getRoleByKey(role.key);
            if (!existing) {
              await ctx.repository.addRole({ id: undefined as any, ...role });
            }
          }
          console.log(`Seeded ${roles.length} roles`);
        } else {
          console.warn(`Unknown preset ${options.preset}`);
        }
      } finally {
        await ctx.prisma.$disconnect();
      }
    });

  program
    .command("entitlements grant")
    .requiredOption("--user <userId>")
    .requiredOption("--role <roleId>")
    .option("--expires <date>")
    .action(async (options) => {
      const ctx = await createContext();
      try {
        const expiresAt = options.expires ? new Date(options.expires) : undefined;
        const result = await ctx.entitlements.grant({
          userId: options.user,
          roleId: options.role,
          grantedBy: "cli",
          expiresAt,
        });
        console.log(JSON.stringify(result, null, 2));
      } finally {
        await ctx.prisma.$disconnect();
      }
    });

  program
    .command("sod rules add")
    .requiredOption("--key <key>")
    .requiredOption("--left <role>")
    .option("--right <role>")
    .option("--severity <severity>", "75")
    .action(async (options) => {
      const ctx = await createContext();
      try {
        await ctx.repository.addSodRule({
          id: undefined as any,
          key: options.key,
          description: options.key,
          constraint: options.right ? "MUTUAL_EXCLUSION" : "APPROVER_CANNOT_EXECUTE",
          leftRole: options.left,
          rightRole: options.right,
          severity: Number(options.severity ?? 75),
          scope: null,
        });
        console.log(`Added SoD rule ${options.key}`);
      } finally {
        await ctx.prisma.$disconnect();
      }
    });

  program
    .command("rfc create")
    .requiredOption("--type <type>")
    .requiredOption("--title <title>")
    .option("--description <desc>", "")
    .action(async (options) => {
      const ctx = await createContext();
      try {
        const record = await ctx.rfc.create({
          title: options.title,
          type: options.type,
          description: options.description,
          requesterId: "cli",
          rollbackPlan: null,
        });
        console.log(record.id);
      } finally {
        await ctx.prisma.$disconnect();
      }
    });

  program
    .command("rfc submit")
    .requiredOption("--id <id>")
    .option("--impact <level>", "Medium")
    .option("--rollback <level>", "Medium")
    .action(async (options) => {
      const ctx = await createContext();
      try {
        const record = await ctx.rfc.submit(options.id, "cli", {
          risk: {
            impact: options.impact,
            rollbackComplexity: options.rollback,
          },
        });
        console.log(JSON.stringify(record, null, 2));
      } finally {
        await ctx.prisma.$disconnect();
      }
    });

  program
    .command("vendor add")
    .requiredOption("--name <name>")
    .requiredOption("--category <category>")
    .requiredOption("--criticality <level>")
    .action(async (options) => {
      const ctx = await createContext();
      try {
        const vendor = await ctx.vendor.registerVendor({
          name: options.name,
          category: options.category,
          criticality: options.criticality,
        });
        console.log(vendor.id);
      } finally {
        await ctx.prisma.$disconnect();
      }
    });

  program
    .command("vendor ddq")
    .requiredOption("--vendor <id>")
    .requiredOption("--template <key>")
    .requiredOption("--answers <file>")
    .action(async (options) => {
      const ctx = await createContext();
      try {
        const answers = JSON.parse(readFileSync(options.answers, "utf-8"));
        const vendor = await ctx.vendor.recordDdq(options.vendor, {
          questionnaireKey: options.template,
          answers,
          score: 80,
          status: "Completed",
          completedAt: new Date(),
        });
        console.log(JSON.stringify(vendor, null, 2));
      } finally {
        await ctx.prisma.$disconnect();
      }
    });

  program
    .command("incident open")
    .requiredOption("--type <type>")
    .requiredOption("--sev <sev>")
    .requiredOption("--title <title>")
    .action(async (options) => {
      const ctx = await createContext();
      try {
        const incident = await ctx.incidents.open({
          title: options.title,
          type: options.type,
          severity: options.sev,
          description: options.title,
        });
        console.log(incident.id);
      } finally {
        await ctx.prisma.$disconnect();
      }
    });

  program
    .command("bcp test")
    .requiredOption("--plan <planId>")
    .requiredOption("--scenario <scenario>")
    .action(async (options) => {
      const ctx = await createContext();
      try {
        const test = await ctx.bcp.recordTest({
          planId: options.plan,
          scenario: options.scenario,
          participants: ["cli"],
          issues: [],
          outcome: "NeedsFollowup",
        });
        console.log(JSON.stringify(test, null, 2));
      } finally {
        await ctx.prisma.$disconnect();
      }
    });

  program
    .command("kri show")
    .action(async () => {
      const ctx = await createContext();
      try {
        const metrics = await ctx.kri.rollup();
        console.table(metrics.map((m) => ({ key: m.key, value: m.value.toString(), asOf: m.asOf })));
      } finally {
        await ctx.prisma.$disconnect();
      }
    });

  await program.parseAsync(process.argv);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
