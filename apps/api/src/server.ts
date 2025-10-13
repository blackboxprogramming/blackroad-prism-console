import Fastify, { type FastifyInstance } from "fastify";
import fastifyJwt from "@fastify/jwt";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { PrismaWormLedger } from "@blackroad/worm";
import {
  BcpService,
  DEFAULT_POLICY_CONTEXT,
  EntitlementService,
  Gatekeeper,
  IncidentService,
  KriService,
  PrismaGrcRepository,
  RfcService,
  SodEngine,
  VendorService,
  type GrcRepository,
  type PolicyContext,
} from "@blackroad/grc-core";

interface BuildOptions {
  repository?: GrcRepository;
  worm?: PrismaWormLedger;
  policy?: PolicyContext;
  prisma?: PrismaClient;
}

declare module "fastify" {
  interface FastifyRequest {
    user?: {
      id: string;
      roles: string[];
    };
  }
  interface FastifyInstance {
    authenticate: any;
  }
}

export async function buildServer(options: BuildOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({ logger: true }).withTypeProvider<ZodTypeProvider>();

  const prisma = options.prisma ?? new PrismaClient();
  const repository = options.repository ?? new PrismaGrcRepository(prisma);
  const worm = options.worm ?? new PrismaWormLedger(prisma);
  const policy = options.policy ?? DEFAULT_POLICY_CONTEXT;

  const sod = new SodEngine(repository, worm, policy);
  const entitlements = new EntitlementService(repository, sod, worm, policy);
  const rfc = new RfcService(repository, worm);
  const vendor = new VendorService(repository, worm);
  const incidents = new IncidentService(repository, worm, policy);
  const bcp = new BcpService(repository, worm, policy);
  const gatekeeper = new Gatekeeper(repository, worm, policy);
  const kri = new KriService(repository, worm);

  const secret = process.env.GRC_JWT_SECRET ?? "local-dev-secret";
  await app.register(fastifyJwt, { secret });

  app.decorate("authenticate", async (request: any, reply: any) => {
    try {
      const token = await request.jwtVerify();
      request.user = {
        id: token.sub,
        roles: token.roles ?? [],
      };
    } catch (err) {
      return reply.code(401).send({ message: "Unauthorized" });
    }
  });

  const requireRole = (role: string) =>
    async (request: any, reply: any) => {
      if (!request.user?.roles?.includes(role)) {
        return reply.code(403).send({ message: "Forbidden" });
      }
    };

  app.route({
    method: "POST",
    url: "/entitlements/grant",
    preHandler: [app.authenticate, requireRole("grc.admin")],
    schema: {
      body: z.object({
        userId: z.string(),
        roleId: z.string(),
        expiresAt: z.coerce.date().optional(),
      }),
    },
    handler: async (request, reply) => {
      const body = request.body as z.infer<typeof request.routeOptions.schema!.body>;
      const result = await entitlements.grant({
        ...body,
        grantedBy: request.user!.id,
      });
      reply.code(201).send(result);
    },
  });

  app.route({
    method: "POST",
    url: "/entitlements/revoke",
    preHandler: [app.authenticate, requireRole("grc.admin")],
    schema: {
      body: z.object({
        entitlementId: z.string(),
      }),
    },
    handler: async (request, reply) => {
      const body = request.body as { entitlementId: string };
      const entitlement = await entitlements.revoke(body.entitlementId, request.user!.id);
      reply.send(entitlement);
    },
  });

  app.route({
    method: "GET",
    url: "/sod/conflicts",
    preHandler: [app.authenticate, requireRole("grc.reviewer")],
    schema: {
      querystring: z.object({ status: z.string().optional() }),
    },
    handler: async (request, reply) => {
      const query = request.query as { status?: string };
      const conflicts = await repository.listSodConflicts();
      const filtered = query.status ? conflicts.filter((c) => c.status === query.status) : conflicts;
      reply.send(filtered);
    },
  });

  app.route({
    method: "POST",
    url: "/rfc",
    preHandler: [app.authenticate],
    schema: {
      body: z.object({
        title: z.string(),
        type: z.enum(["CODE", "POLICY", "INFRA", "CONTENT"]),
        description: z.string(),
        rollbackPlan: z.string().optional(),
        links: z.record(z.any()).optional(),
      }),
    },
    handler: async (request, reply) => {
      const body = request.body as any;
      const record = await rfc.create({
        title: body.title,
        type: body.type,
        description: body.description,
        requesterId: request.user!.id,
        rollbackPlan: body.rollbackPlan,
        links: body.links,
      });
      reply.code(201).send(record);
    },
  });

  app.route({
    method: "POST",
    url: "/rfc/:id/submit",
    preHandler: [app.authenticate],
    schema: {
      params: z.object({ id: z.string() }),
      body: z.object({
        impact: z.enum(["Low", "Medium", "High", "Critical"]),
        rollbackComplexity: z.enum(["Low", "Medium", "High"]),
        touchesPii: z.boolean().optional(),
        touchesVendors: z.boolean().optional(),
        links: z.record(z.any()).optional(),
      }),
    },
    handler: async (request, reply) => {
      const params = request.params as { id: string };
      const body = request.body as any;
      const record = await rfc.submit(params.id, request.user!.id, {
        risk: {
          impact: body.impact,
          rollbackComplexity: body.rollbackComplexity,
          touchesPii: body.touchesPii,
          touchesVendors: body.touchesVendors,
        },
        links: body.links,
      });
      reply.send(record);
    },
  });

  app.route({
    method: "POST",
    url: "/rfc/:id/approve",
    preHandler: [app.authenticate],
    schema: {
      params: z.object({ id: z.string() }),
      body: z.object({ isControlOwner: z.boolean().optional() }),
    },
    handler: async (request, reply) => {
      const params = request.params as { id: string };
      const body = request.body as { isControlOwner?: boolean };
      const record = await rfc.approve(params.id, request.user!.id, body);
      reply.send(record);
    },
  });

  app.route({
    method: "POST",
    url: "/rfc/:id/reject",
    preHandler: [app.authenticate],
    schema: {
      params: z.object({ id: z.string() }),
      body: z.object({ reason: z.string() }),
    },
    handler: async (request, reply) => {
      const params = request.params as { id: string };
      const body = request.body as { reason: string };
      const record = await rfc.reject(params.id, request.user!.id, body.reason);
      reply.send(record);
    },
  });

  app.route({
    method: "POST",
    url: "/rfc/:id/implement",
    preHandler: [app.authenticate],
    schema: { params: z.object({ id: z.string() }) },
    handler: async (request, reply) => {
      const record = await rfc.markImplemented((request.params as any).id);
      reply.send(record);
    },
  });

  app.route({
    method: "POST",
    url: "/rfc/:id/rollback",
    preHandler: [app.authenticate],
    schema: {
      params: z.object({ id: z.string() }),
      body: z.object({ reason: z.string() }),
    },
    handler: async (request, reply) => {
      const params = request.params as { id: string };
      const body = request.body as { reason: string };
      const record = await rfc.rollback(params.id, body.reason);
      reply.send(record);
    },
  });

  app.route({
    method: "POST",
    url: "/vendors",
    preHandler: [app.authenticate, requireRole("grc.vendor")],
    schema: {
      body: z.object({
        name: z.string(),
        category: z.enum(["Custodian", "CryptoVenue", "Data", "Cloud", "Advisory", "Other"]),
        criticality: z.enum(["High", "Medium", "Low"]),
        status: z.enum(["Active", "Onboarding", "Offboarded"]).optional(),
      }),
    },
    handler: async (request, reply) => {
      const body = request.body as any;
      const record = await vendor.registerVendor(body);
      reply.code(201).send(record);
    },
  });

  app.route({
    method: "POST",
    url: "/vendors/:id/docs",
    preHandler: [app.authenticate, requireRole("grc.vendor")],
    schema: {
      params: z.object({ id: z.string() }),
      body: z.object({
        kind: z.enum(["MSA", "BAA", "SOC2", "ISO", "PenTest", "Insurance", "Financials", "BCP", "Privacy"]),
        path: z.string(),
        sha256: z.string(),
        expiresAt: z.coerce.date().optional(),
      }),
    },
    handler: async (request, reply) => {
      const params = request.params as { id: string };
      const body = request.body as any;
      const record = await vendor.attachDocument(params.id, body);
      reply.send(record);
    },
  });

  app.route({
    method: "POST",
    url: "/vendors/:id/ddq",
    preHandler: [app.authenticate, requireRole("grc.vendor")],
    schema: {
      params: z.object({ id: z.string() }),
      body: z.object({
        questionnaireKey: z.string(),
        answers: z.record(z.any()),
        score: z.number().min(0).max(100),
        status: z.enum(["Pending", "Completed", "Expired"]),
        completedAt: z.coerce.date().optional(),
      }),
    },
    handler: async (request, reply) => {
      const params = request.params as { id: string };
      const body = request.body as any;
      const record = await vendor.recordDdq(params.id, body);
      reply.send(record);
    },
  });

  app.route({
    method: "GET",
    url: "/vendors/:id/risk",
    preHandler: [app.authenticate],
    schema: { params: z.object({ id: z.string() }) },
    handler: async (request, reply) => {
      const params = request.params as { id: string };
      const vendorRecord = await repository.getVendorById(params.id);
      if (!vendorRecord) {
        reply.code(404).send({ message: "Vendor not found" });
        return;
      }
      const docs = await repository.listVendorDocs(params.id);
      const ddqs = await repository.listDdqs(params.id);
      const breakdown = vendor.computeRisk(vendorRecord, docs, ddqs);
      reply.send({ vendor: vendorRecord, breakdown });
    },
  });

  app.route({
    method: "POST",
    url: "/incidents",
    preHandler: [app.authenticate],
    schema: {
      body: z.object({
        title: z.string(),
        type: z.enum(["Security", "Privacy", "Ops", "Vendor", "BCP"]),
        severity: z.enum(["SEV1", "SEV2", "SEV3", "SEV4"]),
        description: z.string(),
      }),
    },
    handler: async (request, reply) => {
      const body = request.body as any;
      const record = await incidents.open(body);
      reply.code(201).send(record);
    },
  });

  app.route({
    method: "POST",
    url: "/incidents/:id/ack",
    preHandler: [app.authenticate],
    schema: { params: z.object({ id: z.string() }) },
    handler: async (request, reply) => {
      const record = await incidents.acknowledge((request.params as any).id, request.user!.id);
      reply.send(record);
    },
  });

  app.route({
    method: "POST",
    url: "/incidents/:id/resolve",
    preHandler: [app.authenticate],
    schema: {
      params: z.object({ id: z.string() }),
      body: z.object({
        rootCause: z.string().optional(),
        correctiveActions: z.string().optional(),
      }),
    },
    handler: async (request, reply) => {
      const params = request.params as { id: string };
      const body = request.body as any;
      const record = await incidents.resolve(params.id, body);
      reply.send(record);
    },
  });

  app.route({
    method: "POST",
    url: "/bcp/publish",
    preHandler: [app.authenticate, requireRole("grc.bcp")],
    schema: {
      body: z.object({
        version: z.number().int(),
        effectiveAt: z.coerce.date(),
        rtoMinutes: z.number().int(),
        rpoMinutes: z.number().int(),
        contacts: z.record(z.any()),
        scenarios: z.record(z.any()),
        tests: z.array(z.any()).optional(),
      }),
    },
    handler: async (request, reply) => {
      const body = request.body as any;
      const plan = await bcp.publishPlan({
        ...body,
        status: "Active",
      });
      reply.code(201).send(plan);
    },
  });

  app.route({
    method: "POST",
    url: "/bcp/test/run",
    preHandler: [app.authenticate, requireRole("grc.bcp")],
    schema: {
      body: z.object({
        planId: z.string(),
        scenario: z.string(),
        participants: z.array(z.string()),
        issues: z.array(z.string()),
        outcome: z.enum(["Pass", "Fail", "NeedsFollowup"]),
      }),
    },
    handler: async (request, reply) => {
      const body = request.body as any;
      const test = await bcp.recordTest(body);
      reply.code(201).send(test);
    },
  });

  app.route({
    method: "GET",
    url: "/gates/check",
    preHandler: [app.authenticate],
    schema: {
      querystring: z.object({
        action: z.string(),
        vendorId: z.string().optional(),
        rfcId: z.string().optional(),
        approverIds: z.array(z.string()).optional(),
      }),
    },
    handler: async (request, reply) => {
      const query = request.query as any;
      const decision = await gatekeeper.check(query.action, {
        userId: request.user?.id,
        vendorId: query.vendorId,
        rfcId: query.rfcId,
        approverIds: query.approverIds,
        preparerId: request.user?.id,
      });
      reply.send(decision);
    },
  });

  app.route({
    method: "GET",
    url: "/kri/latest",
    preHandler: [app.authenticate, requireRole("grc.reviewer")],
    handler: async (_request, reply) => {
      const metrics = await kri.rollup();
      reply.send(metrics);
    },
  });

  return app;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  buildServer()
    .then((app) => app.listen({ host: "0.0.0.0", port: Number(process.env.PORT) || 3333 }))
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error(err);
      process.exit(1);
    });
}
