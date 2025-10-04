import Fastify from "fastify";
import { ZodTypeProvider, serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import { z } from "zod";
import { ClientOnboardingEngine, GateService, sendEnvelope } from "@blackroad/core";
import { syncEnvelope } from "@blackroad/core";

export async function buildServer() {
  const fastify = Fastify({
    logger: {
      redact: {
        paths: ["req.body", "req.headers.authorization"],
        censor: "[REDACTED]",
      },
    },
  }).withTypeProvider<ZodTypeProvider>();

  fastify.setValidatorCompiler(validatorCompiler);
  fastify.setSerializerCompiler(serializerCompiler);

  const engine = new ClientOnboardingEngine();
  const gates = new GateService(engine.store, engine.policies);

  fastify.post(
    "/onboarding/start",
    {
      schema: {
        body: z.object({
          type: z.enum(["INDIVIDUAL", "TRUST", "BUSINESS"]),
          channel: z.enum(["RIA", "BD", "INSURANCE", "CRYPTO"]),
          accountType: z.string(),
        }),
      },
    },
    async (request) => {
      const result = await engine.start(request.body);
      return result;
    },
  );

  fastify.post(
    "/clients/:id/persons",
    {
      schema: {
        params: z.object({ id: z.string() }),
        body: z.object({ role: z.string(), name: z.string() }),
      },
    },
    async (request) => {
      const person = engine.createPerson({ clientId: request.params.id, role: request.body.role as any, name: request.body.name });
      return person;
    },
  );

  fastify.post(
    "/clients/:id/suitability/score",
    {
      schema: {
        params: z.object({ id: z.string() }),
        body: z.object({
          riskTolerance: z.enum(["Low", "Moderate", "High", "Speculative"]),
          objectives: z.array(z.string()),
          timeHorizon: z.string(),
          liquidityNeeds: z.string(),
          experienceYears: z.number().min(0),
          crypto: z.boolean().optional(),
          walletIds: z.array(z.string()).optional(),
          questionnaire: z.record(z.unknown()).default({}),
        }),
      },
    },
    async (request) => {
      const summary = await engine.scoreSuitability({
        clientId: request.params.id,
        riskTolerance: request.body.riskTolerance,
        objectives: request.body.objectives,
        timeHorizon: request.body.timeHorizon,
        liquidityNeeds: request.body.liquidityNeeds,
        experienceYears: request.body.experienceYears,
        crypto: request.body.crypto,
        walletIds: request.body.walletIds,
        questionnaire: request.body.questionnaire,
      });
      return summary;
    },
  );

  fastify.post(
    "/accountapps/:id/docs/generate",
    {
      schema: {
        params: z.object({ id: z.string() }),
        body: z.object({ sets: z.array(z.string()) }),
      },
    },
    async (request) => {
      const docs = engine.generateDocuments(request.params.id, request.body.sets);
      return { documents: docs };
    },
  );

  fastify.post(
    "/accountapps/:id/esign/send",
    {
      schema: {
        params: z.object({ id: z.string() }),
        body: z.object({ documents: z.array(z.string()) }),
      },
    },
    async (request) => {
      const envelope = await sendEnvelope(engine, request.params.id, request.body.documents);
      return envelope;
    },
  );

  fastify.post(
    "/esign/:envelopeId/sync",
    {
      schema: {
        params: z.object({ envelopeId: z.string() }),
      },
    },
    async (request) => {
      const status = await syncEnvelope(engine, request.params.envelopeId);
      return { status };
    },
  );

  fastify.get(
    "/gates/:clientId/:action",
    {
      schema: {
        params: z.object({ clientId: z.string(), action: z.string() }),
      },
    },
    async (request) => {
      const gate = gates.evaluate(request.params.clientId, request.params.action as any);
      return gate;
    },
  );

  fastify.post(
    "/wallets",
    {
      schema: {
        body: z.object({ clientId: z.string(), chain: z.string(), address: z.string(), label: z.string().optional() }),
      },
    },
    async (request) => {
      const wallet = await engine.addWallet(request.body.clientId, request.body.chain, request.body.address, request.body.label);
      return wallet;
    },
  );

  return fastify;
}

if (process.env.NODE_ENV !== "test") {
  buildServer().then((app) => {
    app.listen({ port: Number(process.env.PORT ?? 3000), host: "0.0.0.0" });
  });
}
