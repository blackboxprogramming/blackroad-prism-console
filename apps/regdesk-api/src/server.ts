import Fastify, { type FastifyInstance } from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import cors from '@fastify/cors';
import { z } from 'zod';
import {
  DeliveryEngine,
  FilingService,
  Gatekeeper,
  InMemoryLicenseMatrix,
  InMemoryRegDeskRepository,
  StubEmailDeliveryClient,
  StubIARDClient,
  StubStatePortalClient,
  appendAuditLog,
  createMaterialChangeEvents,
  exportAuditChain,
  generateEvents
} from '@blackroad/regdesk-core';
import { InMemoryClientOS, StaticComplianceOS } from '@blackroad/regdesk-integrations';
import { loadRulepack } from '@blackroad/regdesk-rules';
import type { Rulepack } from '@blackroad/regdesk-db';

const publishSchema = z.object({
  files: z.array(z.string())
});

export interface ServerOptions {
  repo?: InMemoryRegDeskRepository;
}

export async function createServer(options: ServerOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({ logger: true });
  const repo = options.repo ?? new InMemoryRegDeskRepository();
  const licenseMatrix = new InMemoryLicenseMatrix([], '2024-12-31');
  const compliance = new StaticComplianceOS([]);
  const clientOS = new InMemoryClientOS([]);
  const filingService = new FilingService({
    repo,
    licenseMatrix,
    compliance,
    iard: new StubIARDClient(),
    statePortal: new StubStatePortalClient(),
    actor: 'api'
  });
  const deliveryEngine = new DeliveryEngine({
    repo,
    clientOS,
    email: new StubEmailDeliveryClient(),
    actor: 'api'
  });

  await app.register(cors);
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'BlackRoad RegDesk API',
        version: '0.1.0'
      }
    }
  });
  await app.register(swaggerUi, {
    routePrefix: '/docs'
  });

  app.post('/rulepacks/publish', async (request, reply) => {
    const body = publishSchema.parse(request.body);
    const rulepacks: Rulepack[] = [];
    for (const path of body.files) {
      const rulepack = await loadRulepack(path);
      await repo.upsertRulepack({
        key: rulepack.key,
        version: rulepack.version,
        rules: rulepack.rules as unknown as Rulepack['rules'],
        sourceUrls: rulepack.sourceUrls
      });
      rulepacks.push(rulepack as unknown as Rulepack);
    }
    await appendAuditLog(repo, {
      actor: 'api',
      action: 'rulepack.publish',
      entity: rulepacks.map((r) => r.key).join(','),
      count: rulepacks.length
    });
    reply.status(201).send({ count: rulepacks.length });
  });

  app.post('/regdesk/schedule/generate', async (request, reply) => {
    const schema = z.object({
      from: z.string(),
      to: z.string()
    });
    const query = schema.parse(request.query);
    const rulepacks = await repo.listRulepacks();
    const rules = rulepacks.flatMap((pack) => pack.rules as unknown as any);
    const events = await generateEvents({
      range: { from: new Date(query.from), to: new Date(query.to) },
      rules,
      context: {
        fiscalYearEnd: new Date('2024-12-31T00:00:00Z'),
        licenseExpiries: {},
        anniversaries: {}
      },
      repo,
      actor: 'api'
    });
    reply.send({ eventsCreated: events.length });
  });

  app.get('/regdesk/events', async (request, reply) => {
    const schema = z.object({
      status: z.string().optional(),
      track: z.string().optional()
    });
    const query = schema.parse(request.query);
    const events = await repo.listRegEvents({
      status: query.status as any,
      track: query.track as any
    });
    reply.send(events);
  });

  app.post('/regdesk/events/:id/file', async (request, reply) => {
    const paramsSchema = z.object({ id: z.string() });
    const bodySchema = z.object({
      artifacts: z
        .array(
          z.object({
            name: z.string(),
            path: z.string(),
            checksum: z.string()
          })
        )
        .optional(),
      submit: z.boolean().optional()
    });
    const params = paramsSchema.parse(request.params);
    const body = bodySchema.parse(request.body);
    if (body.artifacts?.length) {
      await filingService.attachArtifacts(params.id, body.artifacts);
    }
    if (body.submit) {
      await filingService.submit(params.id);
    }
    reply.send({ status: 'ok' });
  });

  app.post('/regdesk/deliver', async (request, reply) => {
    const bodySchema = z.object({
      docKind: z.enum(['FORM_CRS', 'ADV_2A', 'ADV_2B', 'PRIVACY', 'BCP', 'OTHER']),
      clients: z.array(z.string()),
      method: z.enum(['EMAIL', 'PORTAL', 'IN_PERSON', 'MAIL']),
      evidence: z.string(),
      version: z.string()
    });
    const body = bodySchema.parse(request.body);
    const logs = await deliveryEngine.deliver({
      docKind: body.docKind,
      clients: body.clients,
      method: body.method,
      evidencePath: body.evidence,
      version: body.version
    });
    reply.send({ deliveries: logs.length });
  });

  app.get('/gates/check', async (request, reply) => {
    const schema = z.object({ action: z.string() });
    const query = schema.parse(request.query);
    const rulepacks = await repo.listRulepacks();
    const rules = rulepacks.flatMap((pack) => pack.rules as unknown as any);
    const gatekeeper = new Gatekeeper({ repo, rules, actor: 'api' });
    await gatekeeper.evaluate();
    const status = await gatekeeper.check(query.action);
    reply.send(status);
  });

  app.get('/audit/export', async (request, reply) => {
    const schema = z.object({ fromIdx: z.string().optional(), toIdx: z.string().optional() });
    const query = schema.parse(request.query);
    const blocks = await exportAuditChain(repo, {
      fromIdx: query.fromIdx ? Number.parseInt(query.fromIdx, 10) : undefined,
      toIdx: query.toIdx ? Number.parseInt(query.toIdx, 10) : undefined
    });
    reply.send({ blocks });
  });

  app.post('/compliance/material-change', async (request, reply) => {
    const schema = z.object({
      id: z.string(),
      title: z.string(),
      version: z.number(),
      effectiveDate: z.string(),
      materialToClients: z.boolean()
    });
    const body = schema.parse(request.body);
    const event = await createMaterialChangeEvents({ policy: body, repo, actor: 'api' });
    reply.send(event);
  });

  return app;
}

if (process.env.NODE_ENV !== 'test') {
  createServer().then((app) => {
    app.listen({ port: Number(process.env.PORT ?? 3333), host: '0.0.0.0' });
  });
}
